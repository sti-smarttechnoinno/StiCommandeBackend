export type RegionId = 'east' | 'west' | 'center' | 'south';
export type WilayaStatus = 'active' | 'limited' | 'inactive';
export type ViewMode = 'accordion' | 'grid';

export interface WilayaDelegate {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  role: string;
}

export interface Wilaya {
  id: string;
  name: string;
  code: string;
  regionId: RegionId;
  regionName: string;
  delegate: WilayaDelegate | null;
  clients: number;
  ordersToday: number;
  revenue: number;
  coverage: number;
  status: WilayaStatus;
  lastActivity: string;
}

export interface RegionData {
  id: RegionId;
  dbId?: string;
  name: string;
  nameFr: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  wilayas: Wilaya[];
  delegates: number;
  clients: number;
  ordersToday: number;
  revenue: number;
  status?: 'active' | 'inactive' | 'archived';
}

export interface RegionsFilters {
  search: string;
  region: RegionId[];
  delegate: string[];
  status: WilayaStatus[];
}

export interface RegionsState {
  filters: RegionsFilters;
  expandedRegions: Set<RegionId>;
  selectedWilaya: string | null;
  viewMode: ViewMode;
  setFilter: <K extends keyof RegionsFilters>(key: K, value: RegionsFilters[K]) => void;
  resetFilters: () => void;
  toggleRegion: (id: RegionId) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSelectedWilaya: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
}
