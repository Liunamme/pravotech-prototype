import { useState } from 'react';
import type { Id } from '@/types/domain';
import { useStore } from '@/store';
import { selectWorkspaceQueue } from '@/store/selectors';
import { CardQueue } from '@/core/cards/CardQueue';
import { DeadlineTimeline } from '@/core/calendar/DeadlineTimeline';
import { SegmentedControl } from '@/shared/ui';
import { useFocusCardIntoView } from '../useFocusCardIntoView';
import styles from './WorkspaceRightPanel.module.css';

export type WorkspaceRightPanelProps = {
  workspaceId: Id;
};

/**
 * Правая колонка уровня 2 (tech-task.md): очередь карточек и календарь
 * пространства делят место сегментами «Очередь · Сроки» — как на уровне 1,
 * а не стопкой друг под другом. Сегмент — локальное состояние (не глобальный
 * `activeSegment`), чтобы уровни 1 и 2 переключались независимо.
 */
export function WorkspaceRightPanel({ workspaceId }: WorkspaceRightPanelProps) {
  const [segment, setSegment] = useState<'queue' | 'deadlines'>('queue');
  const queueCount = useStore((state) => selectWorkspaceQueue(state, workspaceId).length);
  const queueRef = useFocusCardIntoView<HTMLDivElement>();

  /**
   * Клик по сроку просит показать карточку (`focusedCardId`), но переключает он
   * ГЛОБАЛЬНЫЙ сегмент — а здесь сегмент локальный, и до него этот запрос не
   * доходил: колонка оставалась на «Сроках», и клик выглядел как ведущий в
   * никуда.
   *
   * Переключаем прямо во время рендера, а не эффектом: очередь обязана быть
   * смонтирована в ТОМ ЖЕ коммите, в котором появился `focusedCardId` —
   * иначе `useFocusCardIntoView` не найдёт узел карточки, а сам запрос
   * сбрасывается через 50мс.
   */
  const focusedCardId = useStore((state) => state.focusedCardId);
  const [handledFocus, setHandledFocus] = useState<Id | null>(null);
  if (focusedCardId && focusedCardId !== handledFocus) {
    setHandledFocus(focusedCardId);
    setSegment('queue');
  }

  return (
    <div className={styles.root}>
      <div className={styles.topBlock}>
        <SegmentedControl
          aria-label="Режим правой колонки"
          value={segment}
          onValueChange={(value) => setSegment(value as 'queue' | 'deadlines')}
          options={[
            { value: 'queue', label: 'Очередь', count: queueCount },
            { value: 'deadlines', label: 'Сроки' },
          ]}
        />
      </div>

      <div key={segment} className={styles.panelBody} ref={segment === 'queue' ? queueRef : undefined}>
        {segment === 'queue' ? (
          <CardQueue scope={workspaceId} />
        ) : (
          <DeadlineTimeline scope={workspaceId} />
        )}
      </div>
    </div>
  );
}
