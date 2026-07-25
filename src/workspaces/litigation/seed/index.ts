import type { WorkspaceSeed } from '@/workspaces/types';
import { litigationDocuments } from './documents';
import { litigationCards } from './cards';
import { litigationEvents } from './events';
import { litigationThreads } from './threads';
import { litigationMessages } from './messages';

/**
 * Полный сид пространства «Дела» (этап 8): шесть документов канона,
 * полная очередь карточек (`pending`/решённые), календарь и треды с
 * готовой историей диалогов (docs/SCENARIOS.md §2).
 */
export const litigationSeed: WorkspaceSeed = {
  documents: litigationDocuments,
  cards: litigationCards,
  events: litigationEvents,
  threads: litigationThreads,
  messages: litigationMessages,
};
