import api from './api';
import type { StockMovement, LowStockItem, WarehouseActivity, MovementType, MovementStatus } from '@/features/stock/types';

export interface StockMovementsResponse {
  data: StockMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockKpisResponse {
  currentStock: number;
  incomingToday: number;
  outgoingToday: number;
  transfersCount: number;
  adjustmentsCount: number;
  lowStockCount: number;
  trends: {
    currentStock: number;
    incomingToday: number;
    outgoingToday: number;
    transfersCount: number;
    adjustmentsCount: number;
    lowStockCount: number;
  };
  sparklines?: {
    currentStock?: number[];
    incomingToday?: number[];
    outgoingToday?: number[];
  };
}

export interface StockAnalyticsResponse {
  summary: {
    incoming: number;
    outgoing: number;
    transfers: number;
    adjustments: number;
  };
  lowStock: LowStockItem[];
  warehouses: WarehouseActivity[];
}

export interface StockFilterOptionsResponse {
  warehouses: string[];
  delegates: string[];
  movementTypes: MovementType[];
  statuses: MovementStatus[];
  products: {
    id: string;
    name: string;
    code: string;
    warehouse: string;
    currentStock: number;
  }[];
}

export interface StockParams {
  search?: string;
  warehouse?: string[];
  movementType?: MovementType[];
  delegate?: string[];
  status?: MovementStatus[];
  dateStart?: string;
  dateEnd?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreateStockMovementPayload {
  product_id: string | number;
  movement_type: MovementType;
  quantity: number;
  warehouse: string;
  destination_warehouse?: string;
  delegate_name?: string;
  status?: MovementStatus;
  notes?: string;
}

export const stockService = {
  async list(params: StockParams = {}): Promise<StockMovementsResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.warehouse?.length) query.warehouse = params.warehouse;
    if (params.movementType?.length) query.movementType = params.movementType;
    if (params.delegate?.length) query.delegate = params.delegate;
    if (params.status?.length) query.status = params.status;
    if (params.dateStart) query.dateStart = params.dateStart;
    if (params.dateEnd) query.dateEnd = params.dateEnd;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page !== undefined) query.page = params.page + 1; // Backend is 1-indexed
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<StockMovementsResponse>('/stock/movements', { params: query });
    return data;
  },

  async getKpis(): Promise<StockKpisResponse> {
    const { data } = await api.get<StockKpisResponse>('/stock/kpis');
    return data;
  },

  async getAnalytics(): Promise<StockAnalyticsResponse> {
    const { data } = await api.get<StockAnalyticsResponse>('/stock/analytics');
    return data;
  },

  async getFilterOptions(): Promise<StockFilterOptionsResponse> {
    const { data } = await api.get<StockFilterOptionsResponse>('/stock/filter-options');
    return data;
  },

  async createMovement(payload: CreateStockMovementPayload): Promise<StockMovement> {
    const { data } = await api.post<{ data: StockMovement; message: string }>('/stock/movements', payload);
    return data.data;
  },
};
