import { cn } from '@/shared/lib/cn';
import styles from './QueueTrigger.module.css';

export type QueueTriggerProps = {
  open: boolean;
  onToggle: () => void;
  /** Сколько карточек ждёт решения. `0` — счётчик не показывается. */
  count: number;
  className?: string;
};

/**
 * «Очередь · N» — вход в выдвижную панель на планшете.
 *
 * Счётчик здесь не украшение: на десктопе очередь всегда на виду, и её объём
 * читается сам собой, а спрятанная за кнопку очередь без числа перестаёт
 * напоминать о себе — юрист не узнает, что за день накопилось три P0.
 */
export function QueueTrigger({ open, onToggle, count, className }: QueueTriggerProps) {
  return (
    <button
      type="button"
      className={cn(styles.root, className)}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={count > 0 ? `Очередь, карточек: ${count}` : 'Очередь'}
    >
      <span className={styles.label}>Очередь</span>
      {count > 0 && (
        <span className={styles.count} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}
