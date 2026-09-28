export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'converted'
  | 'expired';

export interface CrmQuoteItem {
  id?: number;
  quote_id?: number;
  product_id?: number | null;
  product_name: string;
  reference?: string | null;
  unit_price: number;
  quantity: number;
  discount_percent?: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    code?: string;
    nominal_price?: number;
    stock_quantity?: number;
  };
}

export interface CrmQuote {
  id: number;
  quote_code: string;
  client_id?: number | null;
  lead_id?: number | null;
  opportunity_id?: number | null;
  user_id?: number | null;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  region: string;
  wilaya?: string | null;
  address?: string | null;
  status: QuoteStatus;
  subtotal_ht: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_ttc: number;
  issue_date: string;
  valid_until?: string | null;
  converted_order_id?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: CrmQuoteItem[];
  client?: {
    id: number;
    client_code?: string;
    name: string;
    wilaya?: string;
    region?: string;
    phone?: string;
    address?: string;
  };
  lead?: {
    id: number;
    name: string;
    company_name: string;
    wilaya?: string;
    region?: string;
    phone?: string;
    address?: string;
  };
  opportunity?: {
    id: number;
    title: string;
    stage: string;
    amount: number;
  };
  user?: {
    id: number;
    name: string;
    role?: string;
    region?: string;
    wilaya?: string;
  };
  converted_order?: {
    id: string;
    order_code: string;
    status: string;
    total_amount: number;
  };
}

export interface QuoteKpis {
  total_active_value: number;
  active_quotes_count: number;
  accepted_amount_month: number;
  accepted_count_month: number;
  converted_count: number;
  acceptance_rate: number;
  total_quotes_count: number;
}

export interface CreateQuoteItemParam {
  product_id?: number;
  product_name: string;
  reference?: string;
  unit_price: number;
  quantity: number;
  discount_percent?: number;
}

export interface CreateQuoteParams {
  client_id?: number;
  lead_id?: number;
  opportunity_id?: number;
  user_id?: number;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  region: string;
  wilaya?: string;
  address?: string;
  status?: QuoteStatus;
  tax_percent?: number;
  discount_percent?: number;
  issue_date?: string;
  valid_until?: string;
  payment_terms?: string;
  notes?: string;
  items: CreateQuoteItemParam[];
}

export interface ListQuotesParams {
  page?: number;
  per_page?: number;
  status?: QuoteStatus | 'all';
  client_id?: number;
  lead_id?: number;
  opportunity_id?: number;
  user_id?: number;
  region?: string;
  search?: string;
}

export interface ListQuotesResponse {
  data: CrmQuote[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
