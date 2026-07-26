import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CalendarCheck } from 'lucide-react';
import type { CalendarEvent, Id } from '@/types/domain';
import { TODAY_SCOPE } from '@/types/domain';
import { useStore } from '@/store';
import { selectUpcoming } from '@/store/selectors';
import { workspaces } from '@/workspaces/registry';
import { Button, EmptyState } from '@/shared/ui';
import { formatDate, formatDayHeader } from '@/shared/lib/date';
import { EventRow } from '../EventRow';
import { useScrollFade } from '@/shared/lib/useScrollFade';
import styles from './DeadlineTimeline.module.css';

export type DeadlineTimelineProps = {
  /** `'today'` — сроки всех пространств, иначе — id конкретного пространства (docs/UX.md §5, тот же контракт, что и `CardQueue`). */
  scope: typeof TODAY_SCOPE | Id;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 14;

/**
 * Таймлайн сроков (docs/UX.md §5): группировка по дням с липкими
 * заголовками, дни без событий не показываются, разрыв больше недели —
 * тонкий разделитель «···».
 */
export function DeadlineTimeline({ scope }: DeadlineTimelineProps) {
  /**
   * Затухание краёв — то же, что в списке договоров и ленте сообщений:
   * содержимое уходит «в никуда», а не обрывается по краю панели. Включается
   * только когда за краем реально есть скрытые сроки.
   */
  const fade = useScrollFade();
  const groups = useStore((state) => selectUpcoming(state, HORIZON_DAYS));
  const documents = useStore((state) => state.documents);
  const cards = useStore((state) => state.cards);
  const focusCard = useStore((state) => state.focusCard);
  const setSegment = useStore((state) => state.setSegment);
  const openInspector = useStore((state) => state.openInspector);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filteredGroups = useMemo(() => {
    if (scope === TODAY_SCOPE) return groups;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((event) => event.workspaceId === scope) }))
      .filter((group) => group.items.length > 0);
  }, [groups, scope]);

  /**
   * Куда ведёт строка срока. Порядок — от частного к общему:
   *  1. карточка в очереди (`relatedCardId`) — самое конкретное действие;
   *  2. цитата в документе (`sources[0]`) — открыть документ на нужном пункте;
   *  3. предмет события (`subjectRef`) — открыть договор или дело целиком.
   * `undefined` — вести некуда, строка не кликабельна.
   *
   * Ссылки проверяются по стору: карточка или документ могли не доехать до
   * состояния, и тогда клик молча ничего бы не делал.
   */
  function resolveTarget(event: CalendarEvent): { kind: 'card'; cardId: Id } | { kind: 'doc'; docId: Id; anchorId?: Id } | undefined {
    if (event.relatedCardId && cards[event.relatedCardId]) {
      return { kind: 'card', cardId: event.relatedCardId };
    }
    const source = event.sources?.[0];
    if (source && documents[source.docId]) {
      return { kind: 'doc', docId: source.docId, anchorId: source.anchorId };
    }
    if (event.subjectRef && documents[event.subjectRef.id]) {
      return { kind: 'doc', docId: event.subjectRef.id };
    }
    return undefined;
  }

  function handleOpen(event: CalendarEvent) {
    const target = resolveTarget(event);
    if (!target) return;

    if (target.kind === 'card') {
      setSegment('queue');
      focusCard(target.cardId);
      return;
    }

    openInspector(target.docId, target.anchorId);
    const next = new URLSearchParams(searchParams);
    next.set('doc', target.docId);
    if (target.anchorId) next.set('anchor', target.anchorId);
    else next.delete('anchor');
    setSearchParams(next);
  }

  if (filteredGroups.length === 0) {
    const horizon = new Date(Date.now() + HORIZON_DAYS * 24 * 60 * 60 * 1000);
    const firstWorkspace = workspaces[0];
    return (
      <div className={styles.root}>
        <EmptyState
          className={styles.empty}
          icon={CalendarCheck}
          title="Ближайшие две недели свободны"
          description={`Ни одного срока до ${formatDate(horizon)}. Более дальние — в календаре пространства.`}
          action={
            scope === TODAY_SCOPE && firstWorkspace ? (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/w/${firstWorkspace.id}`)}>
                Открыть календарь
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.root} ref={fade.ref} onScroll={fade.onScroll}>
      <div className={styles.list} role="region" aria-label="Ближайшие сроки">
        {filteredGroups.map((group, index) => {
          const previous = filteredGroups[index - 1];
          const showGapDivider =
            previous !== undefined && Date.parse(group.day) - Date.parse(previous.day) > WEEK_MS;

          return (
            <div key={group.day} className={styles.group}>
              {showGapDivider && (
                <div className={styles.gapDivider} aria-hidden="true">
                  ···
                </div>
              )}
              <header className={styles.dayHeader}>{formatDayHeader(group.day)}</header>
              <div className={styles.dayItems}>
                {group.items.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onOpen={resolveTarget(event) ? handleOpen : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
