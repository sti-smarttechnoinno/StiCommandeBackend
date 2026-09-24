import api from './api';

export interface OrderItemData {
  id?: string;
  product_id?: string;
  product_name: string;
  reference?: string;
  unit_price: number;
  quantity: number;
  validated_quantity?: number;
  subtotal: number;
  category?: string;
  category_name?: string;
  is_virtual?: boolean;
}

export interface OrderValidationItemPayload {
  item_id: string;
  product_name: string;
  reference?: string;
  quantity_validated: number;
  cumulative_quantity: number;
  ordered_quantity: number;
  remaining_quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderValidationLogData {
  id: string;
  order_id: string;
  batch_number: number;
  status: string;
  validated_by?: string;
  total_quantity: number;
  total_amount: number;
  items_payload?: OrderValidationItemPayload[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderData {
  id: string;
  order_code: string;
  client_id?: string;
  client_name: string;
  delegate_id?: string;
  delegate_name?: string;
  region: string;
  wilaya?: string;
  delivery_address?: string;
  total_amount: number;
  status: 'pending' | 'validated' | 'partially_validated' | 'processing' | 'delivered' | 'cancelled' | 'rejected';
  payment_method: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItemData[];
  client?: any;
  delegate?: any;
  has_virtual_items?: boolean;
  has_physical_items?: boolean;
  workflow_type?: 'virtual' | 'physical' | 'mixed';
  requires_delivery?: boolean;
  categories?: string[];
  validation_logs?: OrderValidationLogData[];
  delivery_notes?: any[];
  deliveryNotes?: any[];
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  region?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ListOrdersResponse {
  data: OrderData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderKpis {
  totalOrders: number;
  pendingOrders: number;
  validatedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  balance?: number;
  productsOrdered?: number;
  todayProductsOrdered?: number;
  totalProductsOrdered?: number;
  productsGrowth?: number;
  ordersGrowth?: number;
  revenueGrowth?: number;
  pendingGrowth?: number;
  validatedGrowth?: number;
  deliveredGrowth?: number;
  ordersSparkline?: number[];
  revenueSparkline?: number[];
  pendingSparkline?: number[];
  validatedSparkline?: number[];
  deliveredSparkline?: number[];
}

export const ordersService = {
  list: async (params?: ListOrdersParams): Promise<ListOrdersResponse> => {
    const res = await api.get<ListOrdersResponse>('/orders', { params });
    return res.data;
  },

  getKpis: async (): Promise<OrderKpis> => {
    const res = await api.get<OrderKpis>('/orders/kpis');
    return res.data;
  },

  get: async (id: string): Promise<OrderData> => {
    const res = await api.get<{ data: OrderData }>(`/orders/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<OrderData> & { items: OrderItemData[] }): Promise<OrderData> => {
    const res = await api.post<{ data: OrderData }>('/orders', data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sti-order-created', {
          detail: { order: res.data?.data, status: res.data?.data?.status || 'pending' },
        })
      );
    }
    return res.data.data;
  },

  update: async (id: string, data: Partial<OrderData> & { items?: OrderItemData[] }): Promise<OrderData> => {
    const res = await api.put<{ data: OrderData }>(`/orders/${id}`, data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sti-order-updated', {
          detail: { id, status: data.status || res.data?.data?.status, order: res.data?.data },
        })
      );
    }
    return res.data.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    validatedItems?: Record<string, number>,
    notes?: string,
    rejectionReason?: string
  ): Promise<{ data: OrderData; delivery_note?: any }> => {
    const payload: any = { status };
    if (notes) payload.notes = notes;
    if (rejectionReason) payload.rejection_reason = rejectionReason;
    if (validatedItems) {
      payload.validated_items = Object.entries(validatedItems).map(([itemId, quantity]) => ({
        id: itemId,
        quantity,
      }));
    }
    const res = await api.put<{ data: OrderData; delivery_note?: any }>(`/orders/${id}`, payload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sti-order-updated', {
          detail: { id, status, order: res.data?.data },
        })
      );
    }
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sti-order-deleted', {
          detail: { id },
        })
      );
    }
  },
};
