import { CalendarClock, Gavel, Hourglass, Users, type LucideIcon } from 'lucide-react';
import type { CalendarEvent, EventKind } from '@/types/domain';
import { Tooltip } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';
import styles from './EventRow.module.css';

export type EventRowProps = {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
};

const KIND_ICON: Record<EventKind, LucideIcon> = {
  deadline: Hourglass,
  hearing: Gavel,
  meeting: Users,
  reminder: CalendarClock,
};

const KIND_LABEL: Record<EventKind, string> = {
  deadline: 'Срок',
  hearing: 'Заседание',
  meeting: 'Встреча',
  reminder: 'Напоминание',
};

/** Строка события таймлайна (docs/UX.md §5): время · тип-иконка · название · привязка к делу. */
export function EventRow({ event, onOpen }: EventRowProps) {
  const Icon = KIND_ICON[event.kind];
  const time = formatDateTime(event.at).split(', ')[1];
  const isClickable = Boolean(event.relatedCardId || (event.sources && event.sources.length > 0));

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(styles.root, isClickable && styles.clickable)}
      onClick={isClickable ? () => onOpen(event) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(event);
              }
            }
          : undefined
      }
    >
      <span className={styles.time}>{time}</span>

      <Tooltip side="top" content={KIND_LABEL[event.kind]}>
        <span className={styles.kindIcon} tabIndex={0} aria-label={KIND_LABEL[event.kind]}>
          <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
        </span>
      </Tooltip>

      <span className={styles.body}>
        <span className={styles.title}>{event.title}</span>
        {event.subjectRef && <span className={styles.subject}>{event.subjectRef.label}</span>}
      </span>

      {event.priority === 'P0' && <span className={styles.p0dot} aria-label="Приоритет P0" />}
    </div>
  );
}
