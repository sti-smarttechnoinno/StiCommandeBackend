'use client';

import { create } from 'zustand';
import type { SettingsState, SettingsTab } from '../types';

export const useSettingsStore = create<SettingsState>((set) => ({
  activeTab: 'company',
  isSaving: false,
  lastSaved: 'Just now',

  setActiveTab: (activeTab: SettingsTab) => set({ activeTab }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved }),
}));
