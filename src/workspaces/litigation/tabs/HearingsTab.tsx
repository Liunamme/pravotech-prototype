/**
 * Вкладка контекста «Заседания» (docs/DOMAIN.md §8, `ContextTabDef`) —
 * хронология вместо табличного среза «Дел»: тот же принцип «разные
 * колонки/форма» (задание этапа 6, п. 6.4), что и различие «Договоры» /
 * «Обязательства» в пространстве `obligations`.
 */
import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Id } from '@/types/domain';
import { useStore } from '@/store';
import { EmptyState } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/lib/date';
import styles from './HearingsTab.module.css';

export function HearingsTab({ workspaceId }: { workspaceId: Id }) {
  const events = useStore((state) => state.events);

  const rows = useMemo(
    () =>
      Object.values(events)
        .filter((event) => event.workspaceId === workspaceId && event.kind === 'hearing')
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    [events, workspaceId],
  );

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          icon={CalendarClock}
          title="Заседаний пока нет"
          description="Здесь появится хронология заседаний по делам этого пространства."
        />
      </div>
    );
  }

  return (
    <div className={styles.root} role="table" aria-label="Хронология заседаний">
      {rows.map((event) => {
        const time = formatDateTime(event.at).split(', ')[1];
        return (
          <div key={event.id} className={styles.row} role="row">
            <div className={styles.dateCol}>
              <span className={styles.day}>{formatDate(event.at)}</span>
              {time && <span className={styles.time}>{time}</span>}
            </div>
            <div className={styles.main}>
              <span className={styles.title}>{event.title}</span>
              {event.location && <span className={styles.location}>{event.location}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
