import type { Order, OrderStatus } from '@/types';

export interface ExtendedOrder extends Order {
  paymentMethod: 'cash' | 'credit' | 'transfer';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deliveryAddress?: string;
  notes?: string;
  rejectionReason?: string;
  items: OrderItem[];
  isVirtual?: boolean;
  workflowType?: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  validatedQuantity?: number;
  unitPrice: number;
  total: number;
}

export type SortField = 'orderNumber' | 'clientName' | 'totalAmount' | 'status' | 'createdAt' | 'delegateName' | 'region';
export type SortDirection = 'asc' | 'desc';

export interface OrderFilters {
  search: string;
  status: OrderStatus[];
  dateRange: { start: Date | null; end: Date | null };
  region: string[];
  delegate: string[];
  client: string[];
  paymentMethod: string[];
  minAmount: number | null;
  maxAmount: number | null;
}

export interface OrdersState {
  filters: OrderFilters;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  setFilter: <K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  toggleExpand: (id: string) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}
