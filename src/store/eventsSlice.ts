import type { StateCreator } from 'zustand';
import type { CalendarEvent, Id } from '@/types/domain';
import type { StoreState } from './index';

export type EventsSlice = {
  events: Record<Id, CalendarEvent>;
  upsertEvent: (event: CalendarEvent) => void;
  hydrateEvents: (events: CalendarEvent[]) => void;
};

export const createEventsSlice: StateCreator<StoreState, [], [], EventsSlice> = (set) => ({
  events: {},

  upsertEvent: (event) =>
    set((state) => ({ events: { ...state.events, [event.id]: event } })),

  hydrateEvents: (events) =>
    set((state) => {
      const next = { ...state.events };
      for (const event of events) next[event.id] = event;
      return { events: next };
    }),
});
