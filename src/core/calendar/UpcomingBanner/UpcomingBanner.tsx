import { Clock } from 'lucide-react';
import { useStore } from '@/store';
import { selectQueueCounts, selectUpcoming } from '@/store/selectors';
import { formatDeadline } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import styles from './UpcomingBanner.module.css';

/**
 * Плашка «Ближайшее» (docs/UX.md §5): постоянная, над сегментами правой
 * колонки уровня 1. Две строки — ближайший срок с обратным отсчётом и
 * счётчик P0 в очереди. Единственный элемент, который видно всегда — он
 * отвечает на первый из трёх вопросов интерфейса (docs/UX.md §1): «что
 * горит прямо сейчас?». Поэтому всегда читает сквозь все пространства
 * (`selectUpcoming`/`selectQueueCounts` без фильтра) — это про весь день
 * юриста, не про одно пространство.
 */
export function UpcomingBanner() {
  const groups = useStore((state) => selectUpcoming(state, 14));
  const counts = useStore(selectQueueCounts);

  const nearest = groups[0]?.items[0];
  const deadline = nearest ? formatDeadline(nearest.at) : null;

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <Clock size={14} strokeWidth={1.75} className={styles.icon} aria-hidden="true" />
        {nearest && deadline ? (
          <span className={styles.nearest}>
            <span className={styles.nearestTitle}>{nearest.title}</span>
            <span className={cn(styles.countdown, styles[`urgency_${deadline.urgency}`])}>{deadline.text}</span>
          </span>
        ) : (
          <span className={styles.nearestEmpty}>Ближайших сроков нет</span>
        )}
      </div>

      <div className={styles.row}>
        <span className={styles.p0label}>P0 в очереди</span>
        <span className={cn(styles.p0count, counts.P0 > 0 && styles.p0active)}>{counts.P0}</span>
      </div>
    </div>
  );
}
