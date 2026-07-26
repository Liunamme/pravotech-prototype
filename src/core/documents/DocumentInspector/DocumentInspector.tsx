import { useEffect, useRef, type RefObject } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStore } from '@/store';
import { IconButton } from '@/shared/ui';
import { DocumentViewer } from '../DocumentViewer';
import styles from './DocumentInspector.module.css';

/**
 * Слайд-овер справа (docs/UX.md §4): открывается из `uiSlice.inspector`,
 * URL-параметры `?doc=&anchor=` синхронизированы в обе стороны — открытие
 * пишет их, загрузка страницы с ними открывает инспектор к нужному месту.
 *
 * На Radix Dialog (фокус-трап и `Esc` из коробки), но не модалка по центру:
 * позиционирован фиксированно у правого края, без затемняющего скрима на
 * весь экран (UX.md допускает «скрим частичный или без него» — здесь его
 * нет, чат остаётся полностью читаемым и кликабельным рядом с инспектором).
 */
export type DocumentInspectorProps = {
  /**
   * design_handoff: инспектор — стеклянный оверлей ВНУТРИ стеклянной плашки
   * `main` (`position: absolute` относительно неё), а не поверх всего окна.
   * Портал Radix уводит контент из потока DOM — без явного `container` он
   * телепортируется в `document.body`, и `position: absolute` в
   * `DocumentInspector.module.css` тогда считался бы от вьюпорта. Страницы
   * (`TodayPage`/`WorkspacePage`) прокидывают сюда узел своей плашки `main`.
   */
  container?: HTMLElement | null;
};

/**
 * Колесо мыши над оверлеем крутит ТОЛЬКО документ — что бы ни лежало под ним.
 *
 * Оверлей накрывает и ленту чата, и колонку очереди. Если браузер по какой-то
 * причине адресует событие колеса не панели, а тому, что под ней (латчинг
 * прокрутки трекпада, промах композиторного хит-теста над стеклом с
 * `backdrop-filter`), интерфейс за панелью уезжает — панель выглядит
 * «прозрачной для прокрутки».
 *
 * Поэтому решение принимается по ГЕОМЕТРИИ панели, а не по цели события.
 * Нормальный путь (цель внутри панели) уходит браузеру нетронутым — прокрутка
 * остаётся родной и плавной; вмешательство только там, где событие промазало.
 * Прямоугольник берётся раз в жест: события колеса идут пачками чаще, чем раз
 * в 250мс, лишних чтений раскладки нет.
 *
 * `passive: false` обязателен — иначе `preventDefault()` игнорируется.
 */
function useInspectorScrollShield(contentRef: RefObject<HTMLDivElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return;

    let rect: DOMRect | null = null;
    let rectAt = 0;

    function onWheel(event: WheelEvent) {
      const panel = contentRef.current;
      const body = panel?.querySelector<HTMLElement>('[data-inspector-body]');
      if (!panel || !body) return;

      // Событие и так адресовано панели — не вмешиваемся.
      if (event.target instanceof Node && panel.contains(event.target)) return;

      if (!rect || event.timeStamp - rectAt > 250) {
        rect = panel.getBoundingClientRect();
        rectAt = event.timeStamp;
      }
      const overPanel =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!overPanel) return;

      // `deltaMode` приводим к пикселям: Firefox шлёт строки (1), отдельные мыши — страницы (2).
      const step =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * body.clientHeight : event.deltaY;
      event.preventDefault();
      body.scrollTop += step;
    }

    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [contentRef, open]);
}

export function DocumentInspector(props: DocumentInspectorProps = {}) {
  const { container } = props;
  /**
   * Страница обещала узел плашки, но он ещё не примонтирован. Рендерить в этот
   * момент нельзя: портал ушёл бы в `document.body`, где `position: absolute;
   * right: 0` считается от страницы, а выезд `translateX(100%)` уводит панель
   * за правый край окна — вёрстка успевает дёрнуться, пока узел не появится.
   */
  const waitingForContainer = 'container' in props && !container;

  const inspector = useStore((state) => state.inspector);
  const documents = useStore((state) => state.documents);
  const openInspector = useStore((state) => state.openInspector);
  const closeInspector = useStore((state) => state.closeInspector);
  const [searchParams, setSearchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);

  // Загрузка страницы с `?doc=&anchor=` в URL открывает инспектор ровно один
  // раз при монтировании — сид грузится синхронно до первого рендера
  // (`hydrateFromRegistry` в main.tsx), так что `documents[docId]` уже
  // доступен на этом эффекте.
  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    const docId = searchParams.get('doc');
    if (!docId || !documents[docId]) return;
    const anchorId = searchParams.get('anchor') ?? undefined;
    openInspector(docId, anchorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doc = inspector ? documents[inspector.docId] : undefined;
  const open = Boolean(inspector && doc) && !waitingForContainer;

  useInspectorScrollShield(contentRef, open);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return; // открытие всегда идёт через `openInspector` (CitationChip и т.п.), не отсюда
    closeInspector();
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.delete('doc');
        nextParams.delete('anchor');
        return nextParams;
      },
      { replace: true },
    );
  }

  return (
    // modal={false} — инспектор это слайд-овер, а не полноэкранная модалка.
    // В modal-режиме Radix блокирует скролл body и компенсирует ширину
    // скроллбара через padding-right, из-за чего весь интерфейс дёргался вбок
    // при открытии. Скрима у инспектора нет, чат под ним остаётся доступен —
    // modal={false} убирает и scroll-lock, и лишний реflow.
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Content
          ref={contentRef}
          className={styles.content}
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Декоративное стекло. Отдельным слоем и без ввода — см. `.glass` в CSS. */}
          <div className={styles.glass} aria-hidden="true" />

          <RadixDialog.Title className={styles.visuallyHidden}>{doc?.title ?? 'Документ'}</RadixDialog.Title>

          <RadixDialog.Close asChild>
            <IconButton
              aria-label="Закрыть инспектор документа"
              variant="ghost"
              size="sm"
              className={styles.close}
            >
              <X size={16} strokeWidth={2} />
            </IconButton>
          </RadixDialog.Close>

          <div className={styles.viewerLayer}>
            {doc && inspector && <DocumentViewer document={doc} activeAnchorId={inspector.anchorId} />}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
