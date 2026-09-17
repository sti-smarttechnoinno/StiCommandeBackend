import { create } from 'zustand';
import type { OrdersState, OrderFilters } from '../types';

const defaultFilters: OrderFilters = {
  search: '',
  status: [],
  dateRange: { start: null, end: null },
  region: [],
  delegate: [],
  client: [],
  paymentMethod: [],
  minAmount: null,
  maxAmount: null,
};

export const useOrdersStore = create<OrdersState>((set) => ({
  filters: { ...defaultFilters },
  selectedIds: new Set<string>(),
  expandedIds: new Set<string>(),
  sort: { field: 'createdAt', direction: 'desc' },
  page: 0,
  pageSize: 10,

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

  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),

  setSort: (field, direction) => set({ sort: { field, direction } }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 0 }),
}));
