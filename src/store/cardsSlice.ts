import type { StateCreator } from 'zustand';
import type { ActionCard, CardDecision, CardState, Id } from '@/types/domain';
import type { StoreState } from './index';

const DECIDED_STATES = new Set<CardState>(['accepted', 'modified', 'rejected']);

/**
 * Граница данных на входе в стор.
 *
 * `decide()` принимает payload из формы — то есть, в перспективе, из
 * браузера. Класть его в стор как есть значит доверять чужой стороне: в
 * прототипе это «всего лишь» кривой payload, но тот же вызов после
 * подключения API станет телом команды. Правило простое: изменённый payload
 * обязан быть объектом ТОЙ ЖЕ формы, что предложил агент, — новые ключи
 * отбрасываются, не-объект отвергается целиком.
 *
 * Это не защита (её даёт только сервер, который берёт карточку по id и сам
 * решает, что менять можно), а честная граница: в стор не попадает то, чего
 * тип карточки не предусматривал.
 */
function sanitizeModifiedPayload(original: unknown, next: unknown): unknown {
  if (original === null || typeof original !== 'object' || Array.isArray(original)) return original;
  if (next === null || typeof next !== 'object' || Array.isArray(next)) return original;

  const allowed = Object.keys(original as Record<string, unknown>);
  const source = next as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    result[key] = key in source ? source[key] : (original as Record<string, unknown>)[key];
  }

  if (import.meta.env.DEV) {
    const extra = Object.keys(source).filter((key) => !allowed.includes(key));
    if (extra.length > 0) {
      console.warn(`[cardsSlice] decide(): отброшены ключи, которых нет в payload карточки: ${extra.join(', ')}.`);
    }
  }

  return result;
}

const DECISION_TO_STATE: Record<CardDecision, CardState> = {
  accept: 'accepted',
  modify: 'modified',
  reject: 'rejected',
};

export type CardsSlice = {
  /**
   * Единственная запись на карточку — очередь «Сегодня» и очередь
   * пространства читают отсюда же, так что решение видно в обоих местах
   * мгновенно (docs/DOMAIN.md, раздел 4).
   */
  cards: Record<Id, ActionCard>;

  hydrateCards: (cards: ActionCard[]) => void;
  upsertCard: (card: ActionCard) => void;
  decide: (id: Id, decision: CardDecision, modifiedPayload?: unknown) => void;
  /** Полностью восстанавливает состояние до `decide()` — опора undo-тоста. */
  undoDecision: (id: Id) => void;
  setCardState: (id: Id, state: CardState) => void;
  setCardFailure: (id: Id, failure: ActionCard['failure']) => void;
  bulkAccept: (ids: Id[]) => void;
};

export const createCardsSlice: StateCreator<StoreState, [], [], CardsSlice> = (set) => ({
  cards: {},

  hydrateCards: (cards) =>
    set((state) => {
      const next = { ...state.cards };
      for (const card of cards) next[card.id] = card;
      return { cards: next };
    }),

  upsertCard: (card) =>
    set((state) => ({ cards: { ...state.cards, [card.id]: card } })),

  decide: (id, decision, modifiedPayload) =>
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;

      const nextState = DECISION_TO_STATE[decision];
      const updated: ActionCard = {
        ...card,
        state: nextState,
        decidedAt: new Date().toISOString(),
        modifiedPayload:
          decision === 'modify' ? sanitizeModifiedPayload(card.payload, modifiedPayload ?? card.payload) : undefined,
      };

      return { cards: { ...state.cards, [id]: updated } };
    }),

  undoDecision: (id) =>
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;

      if (!DECIDED_STATES.has(card.state)) {
        if (import.meta.env.DEV) {
          console.warn(
            `[cardsSlice] undoDecision("${id}"): карточка в состоянии "${card.state}" — отменить решение уже нельзя.`,
          );
        }
        return state;
      }

      const updated: ActionCard = {
        ...card,
        state: 'pending',
        decidedAt: undefined,
        modifiedPayload: undefined,
      };

      return { cards: { ...state.cards, [id]: updated } };
    }),

  setCardState: (id, cardState) =>
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return { cards: { ...state.cards, [id]: { ...card, state: cardState } } };
    }),

  setCardFailure: (id, failure) =>
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return {
        cards: {
          ...state.cards,
          [id]: { ...card, failure, state: failure ? 'failed' : card.state },
        },
      };
    }),

  bulkAccept: (ids) =>
    set((state) => {
      const now = new Date().toISOString();
      const cards = { ...state.cards };
      for (const id of ids) {
        const card = cards[id];
        if (card && card.state === 'pending') {
          cards[id] = { ...card, state: 'accepted', decidedAt: now };
        }
      }
      return { cards };
    }),
});
