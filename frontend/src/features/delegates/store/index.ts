import { create } from 'zustand';
import type { DelegatesState, DelegateFilters } from '../types';

const defaultFilters: DelegateFilters = {
  search: '',
  status: [],
  region: [],
  wilaya: [],
  performance: 'all',
  dateRange: { start: null, end: null },
};

export const useDelegatesStore = create<DelegatesState>((set) => ({
  filters: { ...defaultFilters },
  selectedIds: new Set<string>(),
  sort: { field: 'totalOrders', direction: 'desc' },
  page: 0,
  pageSize: 10,
  selectedDelegate: null,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 0,
    })),

  resetFilters: () => set({ filters: { ...defaultFilters }, page: 0 }),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: (ids) =>
    set((state) => {
      const allSelected = ids.every((id) => state.selectedIds.has(id));
      return { selectedIds: allSelected ? new Set<string>() : new Set(ids) };
    }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  setSort: (field, direction) => set({ sort: { field, direction } }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 0 }),
  setSelectedDelegate: (id) => set({ selectedDelegate: id }),
}));
