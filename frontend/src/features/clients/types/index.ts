import type { Client } from '@/types';

export interface ExtendedClient extends Client {
  clientCode: string;
  clientType: 'retail' | 'wholesale' | 'corporate' | 'government';
  creditLimit: number;
  outstandingBalance: number;
  lastOrderDate: string;
  status: ClientStatus;
  notes?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'pending' | 'blocked';
export type SortField = 'name' | 'clientCode' | 'phone' | 'region' | 'delegateName' | 'totalOrders' | 'totalSpent' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ClientFilters {
  search: string;
  status: ClientStatus[];
  region: string[];
  delegate: string[];
  clientType: string[];
  dateRange: { start: Date | null; end: Date | null };
}

export interface ClientsState {
  filters: ClientFilters;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  setFilter: <K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  toggleExpand: (id: string) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}
