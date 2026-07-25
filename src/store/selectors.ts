/**
 * Селекторы поверх стора. docs/DOMAIN.md требует, чтобы очередь «Сегодня»
 * и очередь пространства читали из ОДНОГО `cards`-слайса — здесь это
 * структурно так: `selectWorkspaceQueue` фильтрует результат
 * `selectTodayQueue`, а не строит собственную выборку.
 *
 * Мемоизация: без зависимости на `reselect` (её нет в package.json).
 * Каждый селектор кэширует последний результат по ссылке на исходный
 * `Record` (`state.cards` / `state.events` / ...). Zustand-слайсы всегда
 * заменяют `Record` целиком при мутации (иммутабельные апдейты в слайсах),
 * поэтому сравнение по ссылке корректно определяет «данные не менялись» —
 * это дешевле полноценного `reselect`, но даёт тот же эффект: пока стор не
 * менялся, повторный вызов возвращает тот же массив/объект, а не создаёт
 * новый на каждый рендер (важно для `useStore(selector)` без `shallow`).
 */

import type {
  ActionCard,
  BackgroundTask,
  CalendarEvent,
  Id,
  Message,
  Priority,
  Thread,
} from '@/types/domain';
import { PRIORITIES } from '@/types/domain';
import type { StoreState } from './index';

const PRIORITY_RANK: Record<Priority, number> = Object.fromEntries(
  PRIORITIES.map((p, i) => [p, i]),
) as Record<Priority, number>;

function compareCards(a: ActionCard, b: ActionCard): number {
  const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;

  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

/* ────────────────────────────  selectTodayQueue  ──────────────────────────── */

let todayQueueCache: { cardsRef: Record<Id, ActionCard>; result: ActionCard[] } | null = null;

/** Карточки всех пространств в состоянии `pending`, отсортированные P0→P3, dueAt↑, createdAt↓. */
export function selectTodayQueue(state: StoreState): ActionCard[] {
  if (todayQueueCache && todayQueueCache.cardsRef === state.cards) return todayQueueCache.result;

  const result = Object.values(state.cards)
    .filter((card) => card.state === 'pending')
    .sort(compareCards);

  todayQueueCache = { cardsRef: state.cards, result };
  return result;
}

/* ──────────────────────────  selectWorkspaceQueue  ────────────────────────── */

const workspaceQueueCache = new Map<
  Id,
  { cardsRef: Record<Id, ActionCard>; result: ActionCard[] }
>();

/** То же, что `selectTodayQueue`, но отфильтровано по пространству. */
export function selectWorkspaceQueue(state: StoreState, workspaceId: Id): ActionCard[] {
  const allQueue = selectTodayQueue(state); // уже отсортирован — фильтр сохраняет порядок

  const cached = workspaceQueueCache.get(workspaceId);
  if (cached && cached.cardsRef === state.cards) return cached.result;

  const result = allQueue.filter((card) => card.workspaceId === workspaceId);
  workspaceQueueCache.set(workspaceId, { cardsRef: state.cards, result });
  return result;
}

/* ──────────────────────────────  selectUpcoming  ──────────────────────────── */

export type UpcomingGroup = { day: string; items: CalendarEvent[] };

const upcomingCache = new Map<
  string,
  { eventsRef: Record<Id, CalendarEvent>; result: UpcomingGroup[] }
>();

/**
 * События на ближайшие `days` дней, отсортированные по `at`, сгруппированные
 * по дню (`day` — префикс ISO-даты, `YYYY-MM-DD`, стабильный ключ для React
 * и группировки; человекочитаемое форматирование — на стороне компонента
 * через `shared/lib/date.ts`).
 *
 * Кэш ключуется по `days` и по минуте — иначе «сегодня» на давно открытой
 * вкладке никогда бы не пересчиталось, хотя `state.events` не менялся.
 */
export function selectUpcoming(state: StoreState, days = 14): UpcomingGroup[] {
  const now = Date.now();
  const minuteBucket = Math.floor(now / 60_000);
  const cacheKey = `${days}:${minuteBucket}`;

  const cached = upcomingCache.get(cacheKey);
  if (cached && cached.eventsRef === state.events) return cached.result;

  const horizon = now + days * 24 * 60 * 60 * 1000;
  const items = Object.values(state.events)
    .filter((event) => {
      const at = Date.parse(event.at);
      return at >= now && at <= horizon;
    })
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const groups: UpcomingGroup[] = [];
  const indexByDay = new Map<string, number>();
  for (const item of items) {
    const day = item.at.slice(0, 10);
    const existingIndex = indexByDay.get(day);
    if (existingIndex === undefined) {
      indexByDay.set(day, groups.length);
      groups.push({ day, items: [item] });
    } else {
      groups[existingIndex]?.items.push(item);
    }
  }

  upcomingCache.set(cacheKey, { eventsRef: state.events, result: groups });
  if (upcomingCache.size > 50) upcomingCache.clear(); // страховка от неограниченного роста

  return groups;
}

/* ───────────────────────────  selectThreadMessages  ───────────────────────── */

const EMPTY_MESSAGES: Message[] = [];

const threadMessagesCache = new Map<
  Id,
  { idsRef: Id[]; messagesRef: Record<Id, Message>; result: Message[] }
>();

export function selectThreadMessages(state: StoreState, threadId: Id): Message[] {
  const ids = state.messageIdsByThread[threadId];
  if (!ids || ids.length === 0) return EMPTY_MESSAGES;

  const cached = threadMessagesCache.get(threadId);
  if (cached && cached.idsRef === ids && cached.messagesRef === state.messages) {
    return cached.result;
  }

  const result = ids
    .map((id) => state.messages[id])
    .filter((m): m is Message => m !== undefined);

  threadMessagesCache.set(threadId, { idsRef: ids, messagesRef: state.messages, result });
  return result;
}

/* ──────────────────────────  selectWorkspaceThreads  ──────────────────────── */

const workspaceThreadsCache = new Map<
  Id,
  { threadsRef: Record<Id, Thread>; result: Thread[] }
>();

/** Треды пространства, отсортированные по `updatedAt` убыв. */
export function selectWorkspaceThreads(state: StoreState, workspaceId: Id): Thread[] {
  const cached = workspaceThreadsCache.get(workspaceId);
  if (cached && cached.threadsRef === state.threads) return cached.result;

  const result = Object.values(state.threads)
    .filter((thread) => thread.workspaceId === workspaceId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  workspaceThreadsCache.set(workspaceId, { threadsRef: state.threads, result });
  return result;
}

/* ───────────────────────────  selectActiveTasks  ──────────────────────────── */

let activeTasksCache: { tasksRef: Record<Id, BackgroundTask>; result: BackgroundTask[] } | null =
  null;

/** Задачи в `queued` / `running` — то, что должно быть видно в `BackgroundTaskTray`. */
export function selectActiveTasks(state: StoreState): BackgroundTask[] {
  if (activeTasksCache && activeTasksCache.tasksRef === state.tasks) return activeTasksCache.result;

  const result = Object.values(state.tasks).filter(
    (task) => task.state === 'queued' || task.state === 'running',
  );

  activeTasksCache = { tasksRef: state.tasks, result };
  return result;
}

/* ───────────────────────────  selectQueueCounts  ──────────────────────────── */

let queueCountsCache: { queueRef: ActionCard[]; result: Record<Priority, number> } | null = null;

/** Счётчики для бейджей: сколько pending-карточек на каждый приоритет. */
export function selectQueueCounts(state: StoreState): Record<Priority, number> {
  const queue = selectTodayQueue(state);
  if (queueCountsCache && queueCountsCache.queueRef === queue) return queueCountsCache.result;

  const counts = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<Priority, number>;
  for (const card of queue) counts[card.priority] += 1;

  queueCountsCache = { queueRef: queue, result: counts };
  return counts;
}
