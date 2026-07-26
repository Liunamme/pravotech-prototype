import { useSearchParams } from 'react-router';
import { FileText } from 'lucide-react';
import type { SourceRef } from '@/types/domain';
import { Tooltip } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { useStore } from '@/store';
import styles from './CitationChip.module.css';

export type CitationChipProps = {
  source: SourceRef;
  /** Порядковый номер внутри блока (1-based) — надстрочная метка чипа. */
  index: number;
  /**
   * `number` — сноска у абзаца: рядом есть текст, к которому она относится,
   * поэтому достаточно цифры.
   * `label` — карточка действия: цифра там висит без текста-носителя и читается
   * как шум, поэтому показываем саму ссылку («п. 7.2») с иконкой источника.
   */
  variant?: 'number' | 'label';
};

/**
 * «Договор аренды №44-АР, п. 7.3» → «п. 7.3»: в карточке договор уже назван
 * строкой выше, поэтому берём последний сегмент после запятой. Если запятой
 * нет (метка — сплошное название документа), обрезаем по длине через CSS
 * (`variant_label` ограничивает ширину и добавляет ellipsis) — сама строка
 * при этом остаётся полной для скринридера через aria-label.
 */
function shortLabel(label: string): string {
  const tail = label.split(',').pop()?.trim();
  return tail && tail.length > 0 ? tail : label;
}

/**
 * Кликабельный источник (ТЗ 4b.5, docs/DOMAIN.md — «каждый вывод агента
 * ссылается на источник, источник кликабелен»). Тултип показывает цитату до
 * открытия документа; клик кладёт `{docId, anchorId}` в инспектор через стор
 * И зеркалит его в `?doc=&anchor=` — ссылка на конкретный момент разговора
 * должна быть шарабельной без похода в чат.
 *
 * Инспектор документов — этап 7 (не в границах этой задачи): здесь клик
 * только готовит состояние для него.
 */
export function CitationChip({ source, index, variant = 'number' }: CitationChipProps) {
  const openInspector = useStore((state) => state.openInspector);
  const [searchParams, setSearchParams] = useSearchParams();

  function handleClick() {
    openInspector(source.docId, source.anchorId);
    const next = new URLSearchParams(searchParams);
    next.set('doc', source.docId);
    if (source.anchorId) {
      next.set('anchor', source.anchorId);
    } else {
      next.delete('anchor');
    }
    setSearchParams(next);
  }

  return (
    <Tooltip
      side="top"
      content={
        <span className={styles.tooltipContent}>
          <strong className={styles.tooltipLabel}>{source.label}</strong>
          <span className={styles.tooltipQuote}>{source.quote}</span>
        </span>
      }
    >
      <button
        type="button"
        className={cn(styles.chip, styles[`variant_${variant}`])}
        onClick={handleClick}
        aria-label={`Источник: ${source.label}`}
      >
        {variant === 'label' ? (
          <>
            <FileText size={11} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.labelText}>{shortLabel(source.label)}</span>
          </>
        ) : (
          index
        )}
      </button>
    </Tooltip>
  );
}
