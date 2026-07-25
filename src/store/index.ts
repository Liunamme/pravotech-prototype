/**
 * Единый стор Zustand, собранный из слайсов (docs/DOMAIN.md, раздел 9).
 * Данные — нормализованные записи `Record<Id, T>`; массивы порядка —
 * только там, где порядок не выводим из самих записей (например,
 * `messageIdsByThread`).
 */

import { create } from 'zustand';

import { createCardsSlice } from './cardsSlice';
import type { CardsSlice } from './cardsSlice';
import { createDocumentsSlice } from './documentsSlice';
import type { DocumentsSlice } from './documentsSlice';
import { createEventsSlice } from './eventsSlice';
import type { EventsSlice } from './eventsSlice';
import { createTasksSlice } from './tasksSlice';
import type { TasksSlice } from './tasksSlice';
import { createThreadsSlice } from './threadsSlice';
import type { ThreadsSlice } from './threadsSlice';
import { createUiSlice } from './uiSlice';
import type { UiSlice } from './uiSlice';

export type StoreState = DocumentsSlice &
  ThreadsSlice &
  CardsSlice &
  EventsSlice &
  TasksSlice &
  UiSlice;

export const useStore = create<StoreState>()((set, get, api) => ({
  ...createDocumentsSlice(set, get, api),
  ...createThreadsSlice(set, get, api),
  ...createCardsSlice(set, get, api),
  ...createEventsSlice(set, get, api),
  ...createTasksSlice(set, get, api),
  ...createUiSlice(set, get, api),
}));

export type { CardsSlice } from './cardsSlice';
export type { DocumentsSlice } from './documentsSlice';
export type { EventsSlice } from './eventsSlice';
export type { InspectorTarget, QueueSegment, UiSlice } from './uiSlice';
export type { TasksSlice } from './tasksSlice';
export type { ThreadsSlice } from './threadsSlice';
