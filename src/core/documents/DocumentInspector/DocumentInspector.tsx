import { useEffect, useRef } from 'react';
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
export function DocumentInspector() {
  const inspector = useStore((state) => state.inspector);
  const documents = useStore((state) => state.documents);
  const openInspector = useStore((state) => state.openInspector);
  const closeInspector = useStore((state) => state.closeInspector);
  const [searchParams, setSearchParams] = useSearchParams();

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
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Content className={styles.content} aria-describedby={undefined}>
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
