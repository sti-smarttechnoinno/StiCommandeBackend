'use client';

import { create } from 'zustand';
import type { NotificationsState } from '../types';

export const useNotificationsStore = create<NotificationsState>((set) => ({
  searchQuery: '',
  selectedCategories: [],
  selectedPriorities: [],
  selectedStatuses: [],
  selectedRegions: [],
  dateRange: { start: '', end: '' },
  selectedCategory: '',
  selectedPriority: '',
  selectedStatus: '',
  selectedRegion: '',
  selectedDelegate: '',
  selectedDateRange: '',
  selectedNotifications: new Set<string>(),
  isDetailsDrawerOpen: false,
  isAnnouncementDialogOpen: false,
  selectedNotificationId: null,
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories, selectedCategory: selectedCategories[0] || '' }),
  setSelectedPriorities: (selectedPriorities) => set({ selectedPriorities, selectedPriority: selectedPriorities[0] || '' }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses, selectedStatus: selectedStatuses[0] || '' }),
  setSelectedRegions: (selectedRegions) => set({ selectedRegions, selectedRegion: selectedRegions[0] || '' }),
  setDateRange: (dateRange) => set({ dateRange }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory, selectedCategories: selectedCategory ? [selectedCategory] : [] }),
  setSelectedPriority: (selectedPriority) => set({ selectedPriority, selectedPriorities: selectedPriority ? [selectedPriority] : [] }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus, selectedStatuses: selectedStatus ? [selectedStatus] : [] }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion, selectedRegions: selectedRegion ? [selectedRegion] : [] }),
  setSelectedDelegate: (selectedDelegate) => set({ selectedDelegate }),
  setSelectedDateRange: (selectedDateRange) => set({ selectedDateRange }),
  toggleNotificationSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedNotifications);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedNotifications: next };
    }),
  selectAllNotifications: (ids) =>
    set((state) => {
      const allSelected = ids.every((id) => state.selectedNotifications.has(id));
      return { selectedNotifications: allSelected ? new Set<string>() : new Set(ids) };
    }),
  clearSelection: () => set({ selectedNotifications: new Set<string>() }),
  setDetailsDrawerOpen: (isDetailsDrawerOpen, id) =>
    set({ isDetailsDrawerOpen, selectedNotificationId: id || null }),
  setAnnouncementDialogOpen: (isAnnouncementDialogOpen) => set({ isAnnouncementDialogOpen }),
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedCategories: [],
      selectedPriorities: [],
      selectedStatuses: [],
      selectedRegions: [],
      dateRange: { start: '', end: '' },
      selectedCategory: '',
      selectedPriority: '',
      selectedStatus: '',
      selectedRegion: '',
      selectedDelegate: '',
      selectedDateRange: '',
    }),
}));
