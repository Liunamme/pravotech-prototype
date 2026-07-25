import type { StateCreator } from 'zustand';
import type { Id, LegalDocument } from '@/types/domain';
import type { StoreState } from './index';

export type DocumentsSlice = {
  documents: Record<Id, LegalDocument>;
  /** Мерджит документы (в т.ч. из сидов нескольких пространств) в стор. */
  hydrateDocuments: (docs: LegalDocument[]) => void;
};

export const createDocumentsSlice: StateCreator<StoreState, [], [], DocumentsSlice> = (set) => ({
  documents: {},

  hydrateDocuments: (docs) =>
    set((state) => {
      const documents = { ...state.documents };
      for (const doc of docs) documents[doc.id] = doc;
      return { documents };
    }),
});
