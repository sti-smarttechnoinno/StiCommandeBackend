export type MovementType = 'incoming' | 'outgoing' | 'transfer' | 'adjustment';
export type MovementStatus = 'completed' | 'pending' | 'in_transit' | 'cancelled';
export type SortField = 'reference' | 'product' | 'movementType' | 'quantity' | 'warehouse' | 'delegate' | 'status' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface StockMovement {
  id: string;
  reference: string;
  productId: string;
  product: string;
  movementType: MovementType;
  quantity: number;
  warehouse: string;
  destinationWarehouse?: string;
  delegate: string;
  status: MovementStatus;
  date: string;
  notes?: string;
}

export interface LowStockItem {
  id: string;
  product: string;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  severity: 'critical' | 'warning' | 'low';
}

export interface WarehouseActivity {
  name: string;
  utilization: number;
  color: string;
}

export interface StockFilters {
  search: string;
  warehouse: string[];
  movementType: MovementType[];
  delegate: string[];
  status: MovementStatus[];
  dateRange: { start: Date | null; end: Date | null };
}

export interface StockState {
  filters: StockFilters;
  selectedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  isMovementModalOpen: boolean;
  refreshTrigger: number;
  triggerRefresh: () => void;
  setFilter: <K extends keyof StockFilters>(key: K, value: StockFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setMovementModalOpen: (open: boolean) => void;
}
