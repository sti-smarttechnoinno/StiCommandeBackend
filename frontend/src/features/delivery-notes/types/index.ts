export interface DeliveryNoteItemData {
  id: string;
  delivery_note_id: string;
  order_item_id?: string;
  product_id?: number;
  product_name: string;
  reference?: string;
  quantity: number;
  discount_percent?: number;
  unit_price: number;
  subtotal: number;
  is_gift?: boolean;
  notes?: string;
}

export type DeliveryNoteStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';
export type DeliveryValidationType = 'full' | 'partial';

export interface DeliveryNoteData {
  id: string;
  delivery_note_code: string;
  order_id?: string;
  order_code: string;
  client_id?: number;
  client_name: string;
  delegate_id?: number;
  delegate_name?: string;
  region: string;
  wilaya: string;
  delivery_address?: string;
  status: DeliveryNoteStatus;
  validation_type: DeliveryValidationType;
  batch_number: number;
  total_quantity: number;
  total_amount: number;
  validated_by?: string;
  validated_at: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items: DeliveryNoteItemData[];
  client?: any;
  delegate?: any;
  order?: any;
}

export interface DeliveryNoteKpis {
  totalDeliveryNotes: number;
  deliveredCount: number;
  inTransitCount: number;
  totalAmount: number;
  partialCount: number;
  fullCount: number;
  countGrowth: number;
  deliveredGrowth: number;
  totalSparkline: number[];
  deliveredSparkline: number[];
  inTransitSparkline: number[];
  amountSparkline: number[];
}

export interface ListDeliveryNotesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  validation_type?: string;
  region?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ListDeliveryNotesResponse {
  data: DeliveryNoteData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDeliveryNoteItemPayload {
  product_id?: number;
  order_item_id?: string;
  product_name: string;
  reference?: string;
  quantity: number;
  discount_percent?: number;
  unit_price: number;
  is_gift?: boolean;
  notes?: string;
}

export interface CreateDeliveryNotePayload {
  order_id?: string;
  order_code?: string;
  client_id?: number;
  client_name: string;
  delegate_id?: number;
  delegate_name?: string;
  region: string;
  wilaya: string;
  delivery_address?: string;
  validation_type?: DeliveryValidationType;
  status?: DeliveryNoteStatus;
  notes?: string;
  items: CreateDeliveryNoteItemPayload[];
}