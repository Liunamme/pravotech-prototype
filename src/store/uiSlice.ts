import type { StateCreator } from 'zustand';
import type { Id } from '@/types/domain';
import type { StoreState } from './index';

/** Что открыто в инспекторе документа: документ + опциональный якорь для скролла/подсветки. */
export type InspectorTarget = { docId: Id; anchorId?: Id };

export type QueueSegment = 'queue' | 'deadlines';

export type UiSlice = {
  inspector: InspectorTarget | null;
  focusedCardId: Id | null;
  activeSegment: QueueSegment;

  openInspector: (docId: Id, anchorId?: Id) => void;
  closeInspector: () => void;
  focusCard: (id: Id | null) => void;
  setSegment: (segment: QueueSegment) => void;
};

// Тема живёт в ThemeProvider (localStorage + prefers-color-scheme) — не дублируется здесь.
export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set) => ({
  inspector: null,
  focusedCardId: null,
  activeSegment: 'queue',

  openInspector: (docId, anchorId) => set({ inspector: { docId, anchorId } }),
  closeInspector: () => set({ inspector: null }),
  focusCard: (id) => set({ focusedCardId: id }),
  setSegment: (segment) => set({ activeSegment: segment }),
});
