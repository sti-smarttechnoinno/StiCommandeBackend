'use client';

import { create } from 'zustand';
import type { ReportsState } from '../types';

export const useReportsStore = create<ReportsState>((set) => ({
  dateRange: '30d',
  searchQuery: '',
  selectedRegion: '',
  selectedWilaya: '',
  selectedDelegate: '',
  selectedWarehouse: '',
  selectedProduct: '',
  selectedReportType: '',
  selectedStatus: '',
  isCreateDialogOpen: false,
  refreshKey: 0,

  setDateRange: (dateRange) => set({ dateRange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  setSelectedWilaya: (selectedWilaya) => set({ selectedWilaya }),
  setSelectedDelegate: (selectedDelegate) => set({ selectedDelegate }),
  setSelectedWarehouse: (selectedWarehouse) => set({ selectedWarehouse }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setSelectedReportType: (selectedReportType) => set({ selectedReportType }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
  setCreateDialogOpen: (isCreateDialogOpen) => set({ isCreateDialogOpen }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedRegion: '',
      selectedWilaya: '',
      selectedDelegate: '',
      selectedWarehouse: '',
      selectedProduct: '',
      selectedReportType: '',
      selectedStatus: '',
    }),
}));
