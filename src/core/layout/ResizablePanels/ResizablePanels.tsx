import {
  Children,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '@/shared/lib/useLocalStorage';
import { cn } from '@/shared/lib/cn';
import styles from './ResizablePanels.module.css';

export type PanelConfig = {
  id: string;
  /** Начальная ширина в px. Игнорируется для flex-панели. */
  defaultWidth?: number;
  /** Минимальная ширина в px. По умолчанию — то же, что и --panel-min-width (260). */
  minWidth?: number;
  /** Максимальная ширина в px. По умолчанию считается динамически от ширины контейнера. */
  maxWidth?: number;
  /** Ровно одна панель в наборе должна иметь flex: true — она занимает остаток. */
  flex?: boolean;
};

type ResizablePanelsProps = {
  storageKey: string;
  panels: PanelConfig[];
  children: ReactNode;
  className?: string;
};

type WidthMap = Record<string, number>;

// Синхронизировано с --panel-min-width в tokens.css.
const DEFAULT_MIN_WIDTH = 260;
const DEFAULT_WIDTH = 280;
const ARROW_STEP = 16;
// Синхронизировано с треком резайзера в CSS (var(--space-2) = 8px).
const RESIZER_PX = 8;
// Минимальный резерв под flex-панель при расчёте динамического максимума соседей.
const FLEX_MIN_RESERVE = 200;

type DragState = {
  controlledId: string;
  direction: 1 | -1;
  startX: number;
  startWidth: number;
  min: number;
  max: number;
  rafId: number | null;
  pendingWidth: number | null;
};

export function ResizablePanels({ storageKey, panels, children, className }: ResizablePanelsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const defaultWidths = useMemo<WidthMap>(() => {
    const map: WidthMap = {};
    for (const panel of panels) {
      if (!panel.flex) map[panel.id] = panel.defaultWidth ?? DEFAULT_WIDTH;
    }
    return map;
    // panels считаем стабильным набором на весь жизненный цикл экрана.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [storedWidths, setStoredWidths] = useLocalStorage<WidthMap>(
    `pravotech:panels:${storageKey}`,
    defaultWidths,
  );

  const widths = useMemo<WidthMap>(() => {
    const merged: WidthMap = { ...defaultWidths };
    for (const [id, value] of Object.entries(storedWidths)) {
      if (id in merged && typeof value === 'number' && Number.isFinite(value)) {
        merged[id] = value;
      }
    }
    return merged;
  }, [defaultWidths, storedWidths]);

  const computeMax = useCallback(
    (panelId: string, containerWidth: number): number => {
      const resizerCount = Math.max(panels.length - 1, 0);
      const resizerTotal = resizerCount * RESIZER_PX;
      const othersMin = panels.reduce((sum, panel) => {
        if (panel.id === panelId) return sum;
        const min = panel.flex ? FLEX_MIN_RESERVE : (panel.minWidth ?? DEFAULT_MIN_WIDTH);
        return sum + min;
      }, 0);
      const panelMin = panels.find((panel) => panel.id === panelId)?.minWidth ?? DEFAULT_MIN_WIDTH;
      return Math.max(panelMin, containerWidth - resizerTotal - othersMin);
    },
    [panels],
  );

  const applyWidth = useCallback((id: string, px: number) => {
    rootRef.current?.style.setProperty(`--w-${id}`, `${px}px`);
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, index: number) => {
      const left = panels[index];
      const right = panels[index + 1];
      if (!left || !right) return;

      const controlled = !left.flex ? left : right;
      const direction: 1 | -1 = !left.flex ? 1 : -1;

      const containerWidth = rootRef.current?.clientWidth ?? 0;
      const min = controlled.minWidth ?? DEFAULT_MIN_WIDTH;
      const max = controlled.maxWidth ?? computeMax(controlled.id, containerWidth);
      const startWidth = widths[controlled.id] ?? controlled.defaultWidth ?? DEFAULT_WIDTH;

      dragRef.current = {
        controlledId: controlled.id,
        direction,
        startX: event.clientX,
        startWidth,
        min,
        max,
        rafId: null,
        pendingWidth: null,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [panels, widths, computeMax],
  );

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const deltaX = event.clientX - drag.startX;
      const raw = drag.startWidth + drag.direction * deltaX;
      const clamped = Math.min(drag.max, Math.max(drag.min, raw));
      drag.pendingWidth = clamped;

      if (drag.rafId === null) {
        drag.rafId = requestAnimationFrame(() => {
          const current = dragRef.current;
          if (current && current.pendingWidth !== null) {
            applyWidth(current.controlledId, current.pendingWidth);
          }
          if (current) current.rafId = null;
        });
      }
    }

    function onUp() {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.rafId !== null) cancelAnimationFrame(drag.rafId);
      const finalWidth = Math.round(drag.pendingWidth ?? drag.startWidth);
      dragRef.current = null;
      setStoredWidths((prev) => ({ ...prev, [drag.controlledId]: finalWidth }));
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [applyWidth, setStoredWidths]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, index: number) => {
      const left = panels[index];
      const right = panels[index + 1];
      if (!left || !right) return;
      const controlled = !left.flex ? left : right;

      const containerWidth = rootRef.current?.clientWidth ?? 0;
      const min = controlled.minWidth ?? DEFAULT_MIN_WIDTH;
      const max = controlled.maxWidth ?? computeMax(controlled.id, containerWidth);
      const current = widths[controlled.id] ?? controlled.defaultWidth ?? DEFAULT_WIDTH;

      let next: number | null = null;
      if (event.key === 'ArrowRight') next = Math.min(max, current + ARROW_STEP);
      else if (event.key === 'ArrowLeft') next = Math.max(min, current - ARROW_STEP);
      else if (event.key === 'Home') next = min;
      else if (event.key === 'End') next = max;

      if (next !== null) {
        event.preventDefault();
        const resolved = next;
        applyWidth(controlled.id, resolved);
        setStoredWidths((prev) => ({ ...prev, [controlled.id]: resolved }));
      }
    },
    [panels, widths, computeMax, applyWidth, setStoredWidths],
  );

  const gridTemplateColumns = useMemo(
    () =>
      panels
        .map((panel) => (panel.flex ? 'minmax(0, 1fr)' : `var(--w-${panel.id})`))
        .join(' var(--resizer-w) '),
    [panels],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    const style: Record<string, string> = { gridTemplateColumns };
    for (const panel of panels) {
      if (!panel.flex) {
        const width = widths[panel.id] ?? panel.defaultWidth ?? DEFAULT_WIDTH;
        style[`--w-${panel.id}`] = `${width}px`;
      }
    }
    return style as CSSProperties;
  }, [gridTemplateColumns, panels, widths]);

  const childArray = Children.toArray(children);
  if (childArray.length !== panels.length && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `ResizablePanels(${storageKey}): количество children (${childArray.length}) не совпадает с количеством panels (${panels.length}).`,
    );
  }

  return (
    <div ref={rootRef} className={cn(styles.root, className)} style={rootStyle}>
      {panels.map((panel, index) => {
        const next = panels[index + 1];
        return (
          <Fragment key={panel.id}>
            <div className={styles.panel} data-panel-id={panel.id}>
              {childArray[index]}
            </div>
            {next && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={`Граница между панелями «${panel.id}» и «${next.id}»`}
                tabIndex={0}
                className={styles.resizer}
                onPointerDown={(event) => handlePointerDown(event, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
