'use client';

import { create } from 'zustand';
import type { UsersState } from '../types';

export const useUsersStore = create<UsersState>((set) => ({
  searchQuery: '',
  selectedRoles: [],
  selectedRegions: [],
  selectedStatuses: [],
  selectedRole: '',
  selectedRegion: '',
  selectedWilaya: '',
  selectedStatus: '',
  selectedLastLogin: '',
  selectedTwoFactor: '',
  selectedUsers: new Set<string>(),
  isNewUserDialogOpen: false,
  isDetailsDrawerOpen: false,
  selectedUserId: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedRoles: (selectedRoles) => set({ selectedRoles, selectedRole: selectedRoles[0] || '' }),
  setSelectedRegions: (selectedRegions) => set({ selectedRegions, selectedRegion: selectedRegions[0] || '' }),
  setSelectedStatuses: (selectedStatuses) => set({ selectedStatuses, selectedStatus: selectedStatuses[0] || '' }),
  setSelectedRole: (selectedRole) => set({ selectedRole, selectedRoles: selectedRole ? [selectedRole] : [] }),
  setSelectedRegion: (selectedRegion) => set({ selectedRegion, selectedRegions: selectedRegion ? [selectedRegion] : [] }),
  setSelectedWilaya: (selectedWilaya) => set({ selectedWilaya }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus, selectedStatuses: selectedStatus ? [selectedStatus] : [] }),
  setSelectedLastLogin: (selectedLastLogin) => set({ selectedLastLogin }),
  setSelectedTwoFactor: (selectedTwoFactor) => set({ selectedTwoFactor }),
  toggleUserSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedUsers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedUsers: next };
    }),
  selectAllUsers: (ids) =>
    set((state) => {
      const allSelected = ids.every((id) => state.selectedUsers.has(id));
      return { selectedUsers: allSelected ? new Set<string>() : new Set(ids) };
    }),
  clearSelection: () => set({ selectedUsers: new Set<string>() }),
  setNewUserDialogOpen: (isNewUserDialogOpen) => set({ isNewUserDialogOpen }),
  setDetailsDrawerOpen: (isDetailsDrawerOpen, userId) =>
    set({ isDetailsDrawerOpen, selectedUserId: userId || null }),
  resetFilters: () =>
    set({
      searchQuery: '',
      selectedRoles: [],
      selectedRegions: [],
      selectedStatuses: [],
      selectedRole: '',
      selectedRegion: '',
      selectedWilaya: '',
      selectedStatus: '',
      selectedLastLogin: '',
      selectedTwoFactor: '',
    }),
}));
