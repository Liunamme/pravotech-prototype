/**
 * Dev-ассерты целостности сид-данных (docs/DOMAIN.md, разделы 2, 4, 5).
 * Работает только при `import.meta.env.DEV` — в проде это мёртвый код,
 * убираемый бандлером через dead-code elimination по константе.
 *
 * Принимает либо сырой `WorkspaceSeed` (проверка манифеста до регистрации),
 * либо снимок `StoreState` целиком (проверка после хайдрации нескольких
 * пространств сразу). Битая ссылка на источник обязана падать громко —
 * иначе клик юриста по цитате на демо ведёт в никуда, а не в документ.
 */

import type {
  ActionCard,
  CalendarEvent,
  LegalDocument,
  Message,
  SourceRef,
} from '@/types/domain';
import { getCardType } from '@/workspaces/registry';
import type { WorkspaceSeed } from '@/workspaces/types';
import type { StoreState } from './index';

export type ValidateSeedIntegrityInput = WorkspaceSeed | StoreState;

type Normalized = {
  documents: LegalDocument[];
  cards: ActionCard[];
  events: CalendarEvent[];
  messages: Message[];
};

function isSeed(input: ValidateSeedIntegrityInput): input is WorkspaceSeed {
  return Array.isArray(input.documents);
}

function normalize(input: ValidateSeedIntegrityInput): Normalized {
  if (isSeed(input)) {
    return {
      documents: input.documents,
      cards: input.cards,
      events: input.events,
      messages: input.messages,
    };
  }
  return {
    documents: Object.values(input.documents),
    cards: Object.values(input.cards),
    events: Object.values(input.events),
    messages: Object.values(input.messages),
  };
}

export function validateSeedIntegrity(input: ValidateSeedIntegrityInput): void {
  if (!import.meta.env.DEV) return;

  const { documents, cards, events, messages } = normalize(input);
  const problems: string[] = [];

  const documentsById = new Map(documents.map((doc) => [doc.id, doc]));

  const checkSourceRef = (ref: SourceRef, context: string): void => {
    const doc = documentsById.get(ref.docId);
    if (!doc) {
      problems.push(
        `${context}: SourceRef "${ref.id}" ссылается на несуществующий документ "${ref.docId}"`,
      );
      return;
    }
    const anchor = doc.anchors.find((a) => a.id === ref.anchorId);
    if (!anchor) {
      problems.push(
        `${context}: SourceRef "${ref.id}" ссылается на несуществующий якорь "${ref.anchorId}" в документе "${doc.id}"`,
      );
    }
  };

  // 1–2. SourceRef.docId / anchorId — из карточек, событий и цитат в чате
  // (именно по цитатам в чате юрист кликает чаще всего).
  for (const card of cards) {
    for (const ref of card.sources) checkSourceRef(ref, `Карточка "${card.id}"`);

    // 4. ActionCard.type зарегистрирован в реестре своего пространства.
    if (!getCardType(card.workspaceId, card.type)) {
      problems.push(
        `Карточка "${card.id}": тип "${card.type}" не зарегистрирован в реестре пространства "${card.workspaceId}"`,
      );
    }
  }

  for (const event of events) {
    for (const ref of event.sources ?? []) checkSourceRef(ref, `Событие "${event.id}"`);

    // 5. deadline-событие обязано иметь непустой sources.
    if (event.kind === 'deadline' && (!event.sources || event.sources.length === 0)) {
      problems.push(`Событие-дедлайн "${event.id}" не имеет источников (sources)`);
    }
  }

  for (const message of messages) {
    for (const block of message.blocks) {
      if (block.type === 'text' || block.type === 'table') {
        for (const ref of block.citations) checkSourceRef(ref, `Сообщение "${message.id}"`);
      }
    }
  }

  // 3. DocAnchor.blockId существует в blocks документа.
  for (const doc of documents) {
    const blockIds = new Set(doc.blocks.map((b) => b.id));
    for (const anchor of doc.anchors) {
      if (!blockIds.has(anchor.blockId)) {
        problems.push(
          `Документ "${doc.id}": якорь "${anchor.id}" ссылается на несуществующий блок "${anchor.blockId}"`,
        );
      }
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`[validateSeedIntegrity] ${problem}`);
    throw new Error(
      `Нарушена целостность сид-данных (${problems.length} ошибок). Подробности — в консоли выше.`,
    );
  }
}
