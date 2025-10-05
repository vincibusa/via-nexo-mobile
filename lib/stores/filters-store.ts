import { create } from 'zustand';
import type { PlacesFilters, EventsFilters } from '../types/filters';

interface FiltersStore {
  // Places filters
  placesFilters: PlacesFilters;
  setPlacesFilters: (filters: Partial<PlacesFilters>) => void;
  resetPlacesFilters: () => void;

  // Events filters
  eventsFilters: EventsFilters;
  setEventsFilters: (filters: Partial<EventsFilters>) => void;
  resetEventsFilters: () => void;
}

const defaultPlacesFilters: PlacesFilters = {
  sort: 'distance',
};

const defaultEventsFilters: EventsFilters = {
  time_filter: 'upcoming',
  sort: 'date',
};

export const useFiltersStore = create<FiltersStore>((set) => ({
  // Places
  placesFilters: defaultPlacesFilters,
  setPlacesFilters: (filters) =>
    set((state) => ({
      placesFilters: { ...state.placesFilters, ...filters },
    })),
  resetPlacesFilters: () => set({ placesFilters: defaultPlacesFilters }),

  // Events
  eventsFilters: defaultEventsFilters,
  setEventsFilters: (filters) =>
    set((state) => ({
      eventsFilters: { ...state.eventsFilters, ...filters },
    })),
  resetEventsFilters: () => set({ eventsFilters: defaultEventsFilters }),
}));
