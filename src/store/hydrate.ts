/**
 * Собирает сиды всех зарегистрированных пространств (`workspaces/registry.ts`)
 * в стор и прогоняет dev-ассерты целостности. Пустой реестр — валидный
 * случай (до этапа 6): функция обязана отрабатывать без ошибок при нуле
 * пространств.
 */

import { getAllSeeds } from '@/workspaces/registry';
import { useStore } from './index';
import { validateSeedIntegrity } from './validate';

export function hydrateFromRegistry(): void {
  const seeds = getAllSeeds();
  const { hydrateDocuments, hydrateThreads, hydrateMessages, hydrateCards, hydrateEvents } =
    useStore.getState();

  for (const seed of seeds) {
    hydrateDocuments(seed.documents);
    hydrateThreads(seed.threads);
    hydrateMessages(seed.messages);
    hydrateCards(seed.cards);
    hydrateEvents(seed.events);
  }

  validateSeedIntegrity(useStore.getState());
}
