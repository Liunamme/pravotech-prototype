import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionCard } from '@/types/domain';
import { useStore } from './index';

/**
 * Машина состояний карточки — то место, где двойной клик, вторая вкладка или
 * запоздавший ответ исполнения превращаются во второе реальное действие:
 * второе уведомление контрагенту, второй платёж. Поэтому переходы проверяются
 * по одному, а не «на глаз через интерфейс».
 */
function makeCard(over: Partial<ActionCard> = {}): ActionCard {
  return {
    id: 'card-1',
    workspaceId: 'obligations',
    type: 'renewal_notice',
    priority: 'P1',
    title: 'Уведомление',
    summary: 'Кратко',
    payload: { draftNotice: 'Текст', counterparty: 'ООО «Ромашка»' },
    sources: [],
    createdAt: '2026-07-24T09:00:00+03:00',
    state: 'pending',
    ...over,
  };
}

const card = () => useStore.getState().cards['card-1'];

beforeEach(() => {
  // Предупреждения об отказанных переходах — ожидаемая часть поведения,
  // в выводе тестов они только мешают.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  useStore.setState({ cards: {} });
  useStore.getState().hydrateCards([makeCard()]);
});

describe('decide', () => {
  it('принимает решение из pending', () => {
    useStore.getState().decide('card-1', 'accept');
    expect(card()!.state).toBe('accepted');
    expect(card()!.decidedAt).toBeDefined();
  });

  it('не принимает второе решение по уже решённой карточке', () => {
    const { decide } = useStore.getState();
    decide('card-1', 'accept');
    const firstDecidedAt = card()!.decidedAt;

    decide('card-1', 'reject');
    expect(card()!.state).toBe('accepted');
    expect(card()!.decidedAt).toBe(firstDecidedAt);
  });

  it('не решает карточку, которая уже исполняется', () => {
    const { decide, setCardState } = useStore.getState();
    decide('card-1', 'accept');
    setCardState('card-1', 'executing');

    decide('card-1', 'accept');
    expect(card()!.state).toBe('executing');
  });

  it('оставляет от изменённого payload только известные ключи', () => {
    useStore.getState().decide('card-1', 'modify', {
      draftNotice: 'Правленый текст',
      counterparty: 'ООО «Ромашка»',
      isAdmin: true,
      workspaceId: 'litigation',
    });

    expect(card()!.modifiedPayload).toEqual({
      draftNotice: 'Правленый текст',
      counterparty: 'ООО «Ромашка»',
    });
  });

  it('не пускает в стор payload, который не объект', () => {
    useStore.getState().decide('card-1', 'modify', 'просто строка');
    expect(card()!.modifiedPayload).toEqual(card()!.payload);
  });
});

describe('setCardState', () => {
  it('разрешает нормальный ход исполнения', () => {
    const { decide, setCardState } = useStore.getState();
    decide('card-1', 'accept');
    setCardState('card-1', 'executing');
    setCardState('card-1', 'done');
    expect(card()!.state).toBe('done');
  });

  it('не воскрешает отменённую карточку запоздавшим результатом', () => {
    const { decide, setCardState, undoDecision } = useStore.getState();
    decide('card-1', 'accept');
    setCardState('card-1', 'executing');
    undoDecision('card-1');
    expect(card()!.state).toBe('pending');

    // Прогон отменён, но его `done` всё же долетел.
    setCardState('card-1', 'done');
    expect(card()!.state).toBe('pending');
  });

  it('не даёт исполнить отклонённую карточку', () => {
    const { decide, setCardState } = useStore.getState();
    decide('card-1', 'reject');
    setCardState('card-1', 'executing');
    expect(card()!.state).toBe('rejected');
  });
});

describe('undoDecision', () => {
  it('возвращает в очередь карточку, у которой уже пошло исполнение', () => {
    // Ровно тот случай, который раньше молча отказывал: подтверждение сразу
    // запускает исполнение, и к моменту появления тоста карточка уже
    // `executing`.
    const { decide, setCardState, undoDecision } = useStore.getState();
    decide('card-1', 'accept');
    setCardState('card-1', 'executing');

    undoDecision('card-1');
    expect(card()!.state).toBe('pending');
    expect(card()!.decidedAt).toBeUndefined();
  });

  it('снимает след сорвавшегося прогона', () => {
    const { decide, setCardState, setCardFailure, undoDecision } = useStore.getState();
    decide('card-1', 'accept');
    setCardState('card-1', 'executing');
    setCardFailure('card-1', { message: 'Не удалось', retryable: true });
    expect(card()!.state).toBe('failed');

    undoDecision('card-1');
    expect(card()!.state).toBe('pending');
    expect(card()!.failure).toBeUndefined();
  });

  it('нечего отменять у нерешённой карточки', () => {
    useStore.getState().undoDecision('card-1');
    expect(card()!.state).toBe('pending');
  });
});

describe('bulkAccept', () => {
  it('трогает только нерешённые карточки', () => {
    useStore.getState().hydrateCards([makeCard({ id: 'card-2' }), makeCard({ id: 'card-3' })]);
    const { decide, bulkAccept, cards } = useStore.getState();
    decide('card-2', 'reject');

    bulkAccept(Object.keys(cards));
    const after = useStore.getState().cards;
    expect(after['card-1']!.state).toBe('accepted');
    expect(after['card-2']!.state).toBe('rejected');
    expect(after['card-3']!.state).toBe('accepted');
  });
});
