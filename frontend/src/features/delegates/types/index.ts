export type DelegateStatus = 'online' | 'busy' | 'offline' | 'never_connected' | 'suspended';
export type SortField = 'name' | 'email' | 'phone' | 'region' | 'wilaya' | 'totalOrders' | 'totalRevenue' | 'completionRate' | 'status' | 'lastActivity' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface DelegateFilters {
  search: string;
  status: DelegateStatus[];
  region: string[];
  wilaya: string[];
  performance: 'all' | 'excellent' | 'good' | 'average' | 'poor';
  dateRange: { start: Date | null; end: Date | null };
}

export interface DelegatesState {
  filters: DelegateFilters;
  selectedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  selectedDelegate: string | null;
  setFilter: <K extends keyof DelegateFilters>(key: K, value: DelegateFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSelectedDelegate: (id: string | null) => void;
}
