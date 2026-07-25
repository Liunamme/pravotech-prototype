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
 * Колесо мыши над инспектором крутит ТОЛЬКО тело инспектора.
 *
 * Без этого прокрутка над панелью уходила в то, что лежит под ней (список
 * договоров, лента чата): курсор над шапкой или полями панели — это
 * непрокручиваемая зона, и браузер отдаёт колесо дальше по цепочке; а после
 * возврата фокуса из другого окна первое событие колеса могло прийти с целью
 * из-под панели. Слушатель на фазе перехвата решает по РЕАЛЬНОЙ позиции
 * курсора (`elementFromPoint`), а не по цели события: курсор над панелью →
 * дельта уходит в тело инспектора, что бы ни было целью.
 *
 * `passive: false` обязателен — иначе `preventDefault()` игнорируется (React
 * вешает `onWheel` пассивно, поэтому слушатель нативный).
 */
function useInspectorWheelGuard(contentRef: RefObject<HTMLDivElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return;

    function onWheel(event: WheelEvent) {
      const panel = contentRef.current;
      if (!panel) return;

      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (!under || !panel.contains(under)) return; // курсор не над инспектором — не вмешиваемся

      const body = panel.querySelector<HTMLElement>('[data-inspector-body]');
      if (!body) return;

      // Цель события уже внутри тела — родная прокрутка отработает сама
      // (chaining у краёв закрыт `overscroll-behavior: contain` в CSS).
      if (event.target instanceof Node && body.contains(event.target)) return;

      // Иначе (шапка, поля панели, «промазавшая» цель) — крутим тело сами.
      event.preventDefault();
      body.scrollTop += event.deltaY;
    }

    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, [contentRef, open]);
}

export function DocumentInspector({ container }: DocumentInspectorProps = {}) {
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
  const open = Boolean(inspector && doc);

  useInspectorWheelGuard(contentRef, open);

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

          {doc && inspector && <DocumentViewer document={doc} activeAnchorId={inspector.anchorId} />}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
