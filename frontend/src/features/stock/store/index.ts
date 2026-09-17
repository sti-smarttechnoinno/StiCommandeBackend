import { create } from 'zustand';
import type { StockState, StockFilters } from '../types';

const defaultFilters: StockFilters = {
  search: '',
  warehouse: [],
  movementType: [],
  delegate: [],
  status: [],
  dateRange: { start: null, end: null },
};

export const useStockStore = create<StockState>((set) => ({
  filters: { ...defaultFilters },
  selectedIds: new Set<string>(),
  sort: { field: 'date', direction: 'desc' },
  page: 0,
  pageSize: 10,
  isMovementModalOpen: false,
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),

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
  setMovementModalOpen: (open) => set({ isMovementModalOpen: open }),
}));
