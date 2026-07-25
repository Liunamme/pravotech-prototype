import { FileText, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { MessageBlock, SourceRef } from '@/types/domain';
import { Button } from '@/shared/ui';
import { useStore } from '@/store';
import { cn } from '@/shared/lib/cn';
import { CardRenderer } from '@/core/cards/CardRenderer';
import { StreamingText } from '../StreamingText';
import { CitationChip } from '../CitationChip';
import styles from './MessageBlockView.module.css';

export type MessageBlockViewProps = {
  block: MessageBlock;
  /** `message.status === 'streaming'` И это последний блок сообщения. */
  showCursor: boolean;
  /** Предыдущий блок в сообщении — нужен `clarify`, чтобы не задваивать уже пропетый текстом вопрос. */
  previousBlock: MessageBlock | undefined;
  onOptionSelect: (option: string) => void;
};

/** Грубая эвристика «это число/дата/сумма» — для `tabular-nums` в табличных ячейках (ТЗ 4b.2). */
const NUMERIC_CELL_RE = /^[\s\d.,%₽$€-]+$/;
function isNumericCell(text: string): boolean {
  return NUMERIC_CELL_RE.test(text) && /\d/.test(text);
}

/** Единая точка перехода к документу: стор + зеркало в URL (see CitationChip). */
function useOpenDocument() {
  const openInspector = useStore((state) => state.openInspector);
  const [searchParams, setSearchParams] = useSearchParams();
  return function open(docId: string, anchorId?: string) {
    openInspector(docId, anchorId);
    const next = new URLSearchParams(searchParams);
    next.set('doc', docId);
    if (anchorId) next.set('anchor', anchorId);
    else next.delete('anchor');
    setSearchParams(next);
  };
}

/**
 * Диспетчер по типу блока — размеченный union (`MessageBlock`) через
 * `switch`, чтобы TS проверял полноту при появлении новых типов (ТЗ 4b.2).
 */
export function MessageBlockView({ block, showCursor, previousBlock, onOptionSelect }: MessageBlockViewProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock text={block.text} citations={block.citations} showCursor={showCursor} />;
    case 'table':
      return <TableBlock head={block.head} rows={block.rows} citations={block.citations} />;
    case 'doc_ref':
      return <DocRefBlock docId={block.docId} anchorId={block.anchorId} />;
    case 'card_ref':
      return <CardRefBlock cardId={block.cardId} />;
    case 'clarify': {
      const alreadyAsked = previousBlock?.type === 'text';
      return (
        <ClarifyBlock question={block.question} options={block.options} showQuestion={!alreadyAsked} onOptionSelect={onOptionSelect} />
      );
    }
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

function TextBlock({
  text,
  citations,
  showCursor,
}: {
  text: string;
  citations: SourceRef[];
  showCursor: boolean;
}) {
  return (
    <div className={styles.textBlock}>
      <StreamingText text={text} showCursor={showCursor} />
      {citations.length > 0 && (
        <div className={styles.citations}>
          {citations.map((source, index) => (
            <CitationChip key={source.id} source={source} index={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableBlock({
  head,
  rows,
  citations,
}: {
  head: string[];
  rows: string[][];
  citations: SourceRef[];
}) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {/* Шапка неизменна после создания блока (см. cards.ts/сценарии — блок собирается
                  целиком одним событием, `store` его не мутирует поколоночно): индекс здесь
                  стабилен на весь срок жизни блока, ровно как в MessageItem для самих блоков. */}
              {head.map((cell, index) => (
                <th key={index}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={cn(isNumericCell(cell) && styles.numeric)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {citations.length > 0 && (
        <div className={styles.citations}>
          {citations.map((source, index) => (
            <CitationChip key={source.id} source={source} index={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocRefBlock({ docId, anchorId }: { docId: string; anchorId?: string }) {
  const openDocument = useOpenDocument();
  const document = useStore((state) => state.documents[docId]);
  const anchorLabel = anchorId ? document?.anchors.find((a) => a.id === anchorId)?.label : undefined;

  return (
    <button type="button" className={styles.docRef} onClick={() => openDocument(docId, anchorId)}>
      <span className={styles.docRefIcon} aria-hidden="true">
        <FileText size={18} strokeWidth={1.75} />
      </span>
      <span className={styles.docRefBody}>
        <span className={styles.docRefTitle}>{document?.title ?? 'Открыть документ'}</span>
        {anchorLabel && <span className={styles.docRefMeta}>{anchorLabel}</span>}
      </span>
      <ChevronRight size={16} strokeWidth={1.75} className={styles.docRefChevron} aria-hidden="true" />
    </button>
  );
}

function CardRefBlock({ cardId }: { cardId: string }) {
  // Карточка уже внутри своего треда — бейдж пространства был бы шумом
  // (docs/UX.md §3, тот же принцип, что и для очереди пространства).
  // Раскрытие карточка регулирует сама (`CardRenderer` без `expanded`/
  // `onExpandChange` — неконтролируемый режим): здесь нет общей очереди,
  // которая координировала бы клавиатурную навигацию между несколькими
  // карточками сразу.
  return (
    <div className={styles.cardRef}>
      <CardRenderer cardId={cardId} showWorkspace={false} inChat />
    </div>
  );
}

function ClarifyBlock({
  question,
  options,
  showQuestion,
  onOptionSelect,
}: {
  question: string;
  options: string[];
  showQuestion: boolean;
  onOptionSelect: (option: string) => void;
}) {
  return (
    <div className={styles.clarify}>
      {showQuestion && <p className={styles.clarifyQuestion}>{question}</p>}
      <div className={styles.clarifyOptions} role="group" aria-label="Варианты уточнения">
        {options.map((option) => (
          <Button key={option} variant="secondary" size="sm" onClick={() => onOptionSelect(option)}>
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
