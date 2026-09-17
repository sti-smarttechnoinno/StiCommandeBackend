export type RegionId = 'east' | 'west' | 'center' | 'south';
export type WilayaPerformance = 'excellent' | 'good' | 'average' | 'needs_attention';
export type WilayaStatus = 'active' | 'limited' | 'inactive';
export type SortField = 'rank' | 'name' | 'region' | 'clients' | 'orders' | 'monthlyRevenue' | 'yearlyRevenue' | 'avgOrder' | 'growth' | 'performance' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface WilayaDelegate {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  role: string;
}

export interface WilayaRow {
  id: string;
  name: string;
  code: string;
  regionId: RegionId;
  regionName: string;
  rank: number;
  delegate: WilayaDelegate | null;
  clients: number;
  activeClients: number;
  ordersToday: number;
  ordersMonth: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  avgOrder: number;
  growth: number;
  performance: WilayaPerformance;
  performanceScore: number;
  topProduct: string;
  lastActivity: string;
  status: WilayaStatus;
  revenueTrend: number[];
  ordersTrend: number[];
}

export interface WilayasFilters {
  search: string;
  region: RegionId[];
  delegate: string[];
  revenueRange: string;
  growth: string;
  status: WilayaStatus[];
}

export interface WilayasState {
  filters: WilayasFilters;
  selectedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  selectedWilaya: string | null;
  setFilter: <K extends keyof WilayasFilters>(key: K, value: WilayasFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSelectedWilaya: (id: string | null) => void;
}
