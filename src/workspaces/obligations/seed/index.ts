import type { WorkspaceSeed } from '@/workspaces/types';
import { obligationsDocuments } from './documents';
import { obligationsCards } from './cards';
import { obligationsEvents } from './events';
import { obligationsThreads } from './threads';
import { obligationsMessages } from './messages';

/**
 * Полный сид пространства «Обязательства» (этап 8): шесть документов
 * канона, полная очередь карточек (`pending`/решённые), календарь и
 * треды с готовой историей диалогов (docs/SCENARIOS.md §2).
 */
export const obligationsSeed: WorkspaceSeed = {
  documents: obligationsDocuments,
  cards: obligationsCards,
  events: obligationsEvents,
  threads: obligationsThreads,
  messages: obligationsMessages,
};
