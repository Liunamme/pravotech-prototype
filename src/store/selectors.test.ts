import { beforeEach, describe, expect, it } from 'vitest';
import type { ActionCard } from '@/types/domain';
import { useStore } from './index';
import { selectTodayQueue, selectWorkspaceQueue } from './selectors';

/**
 * Порядок очереди — это порядок, в котором юрист будет разбирать день.
 * Он задан в docs/DOMAIN.md: приоритет, потом ближайший срок, потом свежесть.
 */
function makeCard(over: Partial<ActionCard> & { id: string }): ActionCard {
  return {
    workspaceId: 'obligations',
    type: 'renewal_notice',
    priority: 'P2',
    title: over.id,
    summary: '',
    payload: {},
    sources: [],
    createdAt: '2026-07-01T09:00:00+03:00',
    state: 'pending',
    ...over,
  };
}

const ids = (cards: ActionCard[]) => cards.map((card) => card.id);

beforeEach(() => {
  useStore.setState({ cards: {} });
});

describe('selectTodayQueue', () => {
  it('сначала приоритет, потом ближайший срок, потом свежесть', () => {
    useStore.getState().hydrateCards([
      makeCard({ id: 'p2-поздний', priority: 'P2', dueAt: '2026-08-10T09:00:00+03:00' }),
      makeCard({ id: 'p0', priority: 'P0', dueAt: '2026-09-01T09:00:00+03:00' }),
      makeCard({ id: 'p2-ранний', priority: 'P2', dueAt: '2026-07-30T09:00:00+03:00' }),
      makeCard({ id: 'p1', priority: 'P1' }),
    ]);

    expect(ids(selectTodayQueue(useStore.getState()))).toEqual(['p0', 'p1', 'p2-ранний', 'p2-поздний']);
  });

  it('карточка без срока идёт после карточек со сроком того же приоритета', () => {
    useStore.getState().hydrateCards([
      makeCard({ id: 'без-срока' }),
      makeCard({ id: 'со-сроком', dueAt: '2026-12-31T09:00:00+03:00' }),
    ]);

    expect(ids(selectTodayQueue(useStore.getState()))).toEqual(['со-сроком', 'без-срока']);
  });

  it('решённые карточки покидают очередь', () => {
    useStore.getState().hydrateCards([makeCard({ id: 'a' }), makeCard({ id: 'b' })]);
    useStore.getState().decide('a', 'accept');

    expect(ids(selectTodayQueue(useStore.getState()))).toEqual(['b']);
  });

  it('пересчитывается после изменения стора, а не отдаёт устаревший кэш', () => {
    useStore.getState().hydrateCards([makeCard({ id: 'a' })]);
    const first = selectTodayQueue(useStore.getState());
    expect(selectTodayQueue(useStore.getState())).toBe(first); // тот же массив, пока стор не менялся

    useStore.getState().hydrateCards([makeCard({ id: 'b', priority: 'P0' })]);
    expect(ids(selectTodayQueue(useStore.getState()))).toEqual(['b', 'a']);
  });
});

describe('selectWorkspaceQueue', () => {
  it('фильтрует по пространству, сохраняя общий порядок', () => {
    useStore.getState().hydrateCards([
      makeCard({ id: 'об-p2', priority: 'P2' }),
      makeCard({ id: 'дела-p0', priority: 'P0', workspaceId: 'litigation' }),
      makeCard({ id: 'об-p1', priority: 'P1' }),
    ]);

    expect(ids(selectWorkspaceQueue(useStore.getState(), 'obligations'))).toEqual(['об-p1', 'об-p2']);
    expect(ids(selectWorkspaceQueue(useStore.getState(), 'litigation'))).toEqual(['дела-p0']);
  });
});
