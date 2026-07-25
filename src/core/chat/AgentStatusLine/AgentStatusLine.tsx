import type { AgentStatus } from '@/types/domain';
import styles from './AgentStatusLine.module.css';

export type AgentStatusLineProps = {
  status: AgentStatus;
};

/**
 * Честная латентность (docs/SCENARIOS.md §1, ТЗ 4b.4): подпись +, если есть,
 * полоса `progress` со счётчиком. Без `progress` — неопределённый индикатор,
 * но подпись остаётся видимой: голый бесконечный спиннер без текста запрещён.
 *
 * `role="status"` даёт implicit `aria-live="polite"` + `aria-atomic` — этой
 * строке достаточно собственного региона, отдельного от `aria-live` на
 * теле сообщения (там о своём отчитывается `StreamingText`).
 */
export function AgentStatusLine({ status }: AgentStatusLineProps) {
  const { label, progress } = status;
  const percent =
    progress && progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : null;

  return (
    <div className={styles.root} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {/* `key={label}` перемонтирует span при смене подписи — это и даёт
          плавную замену (crossfade fade-in), а не мигание одного и того же узла. */}
      <span key={label} className={styles.label}>
        {label}
      </span>

      {progress ? (
        <div className={styles.progress}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
          <span className={styles.count}>
            {progress.done} из {progress.total}
          </span>
        </div>
      ) : (
        <div className={styles.indeterminate} aria-hidden="true">
          <div className={styles.indeterminateBar} />
        </div>
      )}
    </div>
  );
}
