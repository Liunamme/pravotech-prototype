import type { Id } from '@/types/domain';
import { CardQueue } from '@/core/cards/CardQueue';
import { DeadlineTimeline } from '@/core/calendar/DeadlineTimeline';
import { useFocusCardIntoView } from '../useFocusCardIntoView';
import styles from './WorkspaceRightPanel.module.css';

export type WorkspaceRightPanelProps = {
  workspaceId: Id;
};

/**
 * Правая колонка уровня 2 (tech-task.md): карточки действий пространства
 * сверху, календарь пространства снизу — оба видны одновременно (в отличие
 * от уровня 1, где на них тесно и они делят место сегментами, здесь своя
 * колонка на пространство и обе поверхности умещаются).
 */
export function WorkspaceRightPanel({ workspaceId }: WorkspaceRightPanelProps) {
  const queueRef = useFocusCardIntoView<HTMLDivElement>();

  return (
    <div className={styles.root}>
      <div className={styles.queueSection} ref={queueRef}>
        <CardQueue scope={workspaceId} />
      </div>
      <div className={styles.calendarSection}>
        <p className={styles.calendarLabel}>Календарь пространства</p>
        <DeadlineTimeline scope={workspaceId} />
      </div>
    </div>
  );
}
