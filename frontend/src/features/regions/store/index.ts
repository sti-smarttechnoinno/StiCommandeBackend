import { create } from 'zustand';
import type { RegionsState, RegionsFilters, RegionId } from '../types';

const defaultFilters: RegionsFilters = {
  search: '',
  region: [],
  delegate: [],
  status: [],
};

export const useRegionsStore = create<RegionsState>((set) => ({
  filters: { ...defaultFilters },
  expandedRegions: new Set<RegionId>(['east']),
  selectedWilaya: null,
  viewMode: 'accordion',

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  toggleRegion: (id) =>
    set((state) => {
      const next = new Set(state.expandedRegions);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedRegions: next };
    }),

  expandAll: () =>
    set({ expandedRegions: new Set<RegionId>(['east', 'west', 'center', 'south']) }),

  collapseAll: () => set({ expandedRegions: new Set<RegionId>() }),

  setSelectedWilaya: (id) => set({ selectedWilaya: id }),

  setViewMode: (mode) => set({ viewMode: mode }),
}));
