import { useMemo, type ReactNode } from 'react';
import { FileStack, FileText, Gavel, Landmark, Mail, type LucideIcon } from 'lucide-react';
import type { DocAnchor, DocBlock, DocumentKind, Id, LegalDocument } from '@/types/domain';
import { Button, ScrollArea } from '@/shared/ui';
import { formatDate } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import { HighlightAnchor, HighlightMark } from '../HighlightAnchor';
import styles from './DocumentViewer.module.css';

export type DocumentViewerProps = {
  document: LegalDocument;
  /** Якорь, к которому нужно проскроллить и который нужно подсветить (docs/UX.md §4). */
  activeAnchorId?: Id;
};

const KIND_LABEL: Record<DocumentKind, string> = {
  contract: 'Договор',
  court_filing: 'Судебный документ',
  correspondence: 'Переписка',
  ruling: 'Определение суда',
  internal: 'Внутренний документ',
};

const KIND_ICON: Record<DocumentKind, LucideIcon> = {
  contract: FileText,
  court_filing: Gavel,
  correspondence: Mail,
  ruling: Landmark,
  internal: FileStack,
};

function hasRange(anchor: DocAnchor | undefined): anchor is DocAnchor & { charStart: number; charEnd: number } {
  return anchor !== undefined && anchor.charStart !== undefined && anchor.charEnd !== undefined;
}

/** Разбивает текст блока на «до / подсвеченный фрагмент / после» по `charStart`/`charEnd` якоря. */
function renderBlockText(text: string, anchor: DocAnchor | undefined): ReactNode {
  if (!hasRange(anchor)) return text;
  const start = Math.max(0, Math.min(anchor.charStart, text.length));
  const end = Math.max(start, Math.min(anchor.charEnd, text.length));

  return (
    <>
      {text.slice(0, start)}
      <HighlightMark>{text.slice(start, end)}</HighlightMark>
      {text.slice(end)}
    </>
  );
}

/**
 * Тело инспектора документа (docs/UX.md §4): шапка (название, стороны, дата
 * подписания, тип) + прокручиваемое тело в `--font-serif`, ширина строки
 * ≤68ch, нумерация пунктов в левом поле `tabular-nums`.
 */
export function DocumentViewer({ document, activeAnchorId }: DocumentViewerProps) {
  const activeAnchor = useMemo(
    () => (activeAnchorId ? document.anchors.find((a) => a.id === activeAnchorId) : undefined),
    [document.anchors, activeAnchorId],
  );
  const Icon = KIND_ICON[document.kind];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.kindRow}>
          <span className={styles.kindIcon} aria-hidden="true">
            <Icon size={16} strokeWidth={1.75} />
          </span>
          <span className={styles.kindLabel}>{KIND_LABEL[document.kind]}</span>
        </div>

        <h2 className={styles.title}>{document.title}</h2>

        <dl className={styles.meta}>
          {document.parties && document.parties.length > 0 && (
            <div className={styles.metaRow}>
              <dt className={styles.metaKey}>Стороны</dt>
              <dd className={styles.metaValue}>{document.parties.join(' · ')}</dd>
            </div>
          )}
          {document.signedAt && (
            <div className={styles.metaRow}>
              <dt className={styles.metaKey}>Дата подписания</dt>
              <dd className={styles.metaValue}>{formatDate(document.signedAt)}</dd>
            </div>
          )}
          {document.meta &&
            Object.entries(document.meta).map(([key, value]) => (
              <div className={styles.metaRow} key={key}>
                <dt className={styles.metaKey}>{key}</dt>
                <dd className={styles.metaValue}>{value}</dd>
              </div>
            ))}
        </dl>

        <Button variant="secondary" size="sm" disabled className={styles.openFull}>
          Открыть полностью
        </Button>
      </header>

      <ScrollArea className={styles.scroll}>
        <div className={styles.prose}>
          {document.blocks.map((block) => {
            const isActive = block.id === activeAnchor?.blockId;
            const anchorForBlock = isActive ? activeAnchor : undefined;
            return <BlockView key={block.id} block={block} isActive={isActive} anchor={anchorForBlock} />;
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function BlockView({ block, isActive, anchor }: { block: DocBlock; isActive: boolean; anchor?: DocAnchor }) {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4';
      return (
        <HighlightAnchor active={isActive} highlightWhole className={styles.headingBlock}>
          <Tag className={cn(styles.heading, styles[`heading_${block.level}`])}>{block.text}</Tag>
        </HighlightAnchor>
      );
    }
    case 'clause':
      return (
        <HighlightAnchor active={isActive} highlightWhole={!hasRange(anchor)} className={styles.clauseRow}>
          <span className={styles.clauseNumber}>{block.number}</span>
          <p className={styles.clauseText}>{renderBlockText(block.text, anchor)}</p>
        </HighlightAnchor>
      );
    case 'paragraph':
      return (
        <HighlightAnchor active={isActive} highlightWhole={!hasRange(anchor)} className={styles.paragraphRow}>
          <p className={styles.paragraphText}>{renderBlockText(block.text, anchor)}</p>
        </HighlightAnchor>
      );
    case 'table':
      return (
        <HighlightAnchor active={isActive} highlightWhole className={styles.tableBlock}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              {block.head && (
                <thead>
                  <tr>
                    {block.head.map((cell, index) => (
                      <th key={index}>{cell}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HighlightAnchor>
      );
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
