import { create } from 'zustand';
import type { ProductsState, ProductFilters } from '../types';

const defaultFilters: ProductFilters = {
  search: '',
  category: [],
  operator: [],
  stockStatus: 'all',
  productStatus: [],
  region: [],
  dateRange: { start: null, end: null },
};

export const useProductsStore = create<ProductsState>((set) => ({
  filters: { ...defaultFilters },
  selectedIds: new Set<string>(),
  sort: { field: 'name', direction: 'asc' },
  page: 0,
  pageSize: 10,
  viewMode: 'table',
  selectedProduct: null,

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
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedProduct: (id) => set({ selectedProduct: id }),
}));
