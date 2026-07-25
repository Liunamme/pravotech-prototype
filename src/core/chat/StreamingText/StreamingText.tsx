import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './StreamingText.module.css';

export type StreamingTextProps = {
  /** Полный текущий текст блока (стор уже держит накопленную строку — токены не разбираются здесь). */
  text: string;
  /** Мигающий курсор в конце — только пока агент реально дописывает именно этот блок. */
  showCursor: boolean;
};

const BOLD_RE = /(\*\*[^*]+\*\*)/g;

/**
 * `**жирный**` — единственная лёгкая markdown-разметка, которую отдают
 * сценарии (`scenarios/content.ts`, комментарий файла: «рендер — забота
 * core/chat»). Пока токен ещё не докачал закрывающие `**`, звёздочки на
 * мгновение видны как есть — приемлемо для потокового вывода и самочинится
 * на следующем токене.
 */
function renderInline(text: string): ReactNode[] {
  return text.split(BOLD_RE).filter((part) => part.length > 0).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/**
 * Параграфы — `\n\n` в сыром тексте сценария. Массив пересчитывается на
 * каждый рендер из полного накопленного текста, но порядок параграфов
 * стабилен (сценарии только дописывают текст в конец, никогда не переставляют
 * и не вставляют посередине) — индекс как `key` здесь легитимен ровно потому,
 * что i-й параграф навсегда остаётся i-м, только дорастает в длину.
 */
function splitParagraphs(text: string): string[] {
  const parts = text.split('\n\n').filter((p) => p.length > 0);
  return parts.length > 0 ? parts : [text];
}

/**
 * Потоковый текстовый блок. Курсор — декоративный элемент; всё содержание
 * уже присутствует в DOM на каждый рендер (это конечное состояние текста на
 * данный момент, не построчная анимация), поэтому раскладка не скачет при
 * дописывании — растёт только последний параграф.
 */
export function StreamingText({ text, showCursor }: StreamingTextProps) {
  const paragraphs = splitParagraphs(text);
  const lastIndex = paragraphs.length - 1;

  return (
    <div className={styles.root}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          {renderInline(paragraph)}
          {showCursor && index === lastIndex && (
            <span className={cn(styles.cursor)} aria-hidden="true" />
          )}
        </p>
      ))}
    </div>
  );
}
