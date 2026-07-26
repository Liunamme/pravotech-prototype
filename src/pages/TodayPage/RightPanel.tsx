import { TODAY_SCOPE } from '@/types/domain';
import { useStore } from '@/store';
import { selectQueueCounts } from '@/store/selectors';
import { CardQueue } from '@/core/cards/CardQueue';
import { DeadlineTimeline } from '@/core/calendar/DeadlineTimeline';
import { UpcomingBanner } from '@/core/calendar/UpcomingBanner';
import { SegmentedControl } from '@/shared/ui';
import { useFocusCardIntoView } from '../useFocusCardIntoView';
import styles from './RightPanel.module.css';

/**
 * Правая колонка уровня 1 (docs/UX.md §5, tech-task.md, раскладка уровня 1):
 * плашка «Ближайшее» — постоянно сверху — и сегменты «Очередь · Сроки»,
 * переключающие содержимое под ней. Смена сегмента — crossfade (docs/UX.md
 * §7): панель перемонтируется по `key={activeSegment}`, что и запускает
 * анимацию появления заново при каждом переключении.
 */
export type RightPanelProps = {
  /**
   * Показывать собственный переключатель «Очередь · Сроки». На телефоне его
   * рисует шапка выдвижной панели — там он занимает пустое место рядом с
   * крестиком вместо отдельной строки.
   */
  showSegments?: boolean;
};

export function RightPanel({ showSegments = true }: RightPanelProps) {
  const activeSegment = useStore((state) => state.activeSegment);
  const setSegment = useStore((state) => state.setSegment);
  const counts = useStore(selectQueueCounts);
  const queueRef = useFocusCardIntoView<HTMLDivElement>();

  const queueCount = counts.P0 + counts.P1 + counts.P2 + counts.P3;

  return (
    <div className={styles.root}>
      <div className={styles.topBlock}>
        <UpcomingBanner />

        {showSegments && (
          <SegmentedControl
            aria-label="Режим правой колонки"
            value={activeSegment}
            onValueChange={(value) => setSegment(value as 'queue' | 'deadlines')}
            options={[
              { value: 'queue', label: 'Очередь', count: queueCount },
              { value: 'deadlines', label: 'Сроки' },
            ]}
          />
        )}
      </div>

      <div key={activeSegment} className={styles.panelBody} ref={activeSegment === 'queue' ? queueRef : undefined}>
        {activeSegment === 'queue' ? <CardQueue scope={TODAY_SCOPE} /> : <DeadlineTimeline scope={TODAY_SCOPE} />}
      </div>
    </div>
  );
}
