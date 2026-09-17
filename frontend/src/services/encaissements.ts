import api from './api';

export interface EncaissementRecord {
  id: number;
  client_id?: number | null;
  tiers_name: string | null;
  order_number: string | null;
  type: 'Encaissement' | 'Décaissement' | string;
  payment_date: string | null;
  amount: number;
  debit: number;
  credit: number;
  payment_mode: string | null;
  reference: string | null;
  status: string | null;
  account: string | null;
  label: string | null;
  locked: boolean;
  is_last: boolean;
  created_at?: string;
  updated_at?: string;
  client?: {
    id: number;
    client_code: string;
    name: string;
    phone?: string;
    wilaya?: string;
    region?: string;
  } | null;
}

export interface EncaissementsKpis {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  totalOperations: number;
  encaissementsCount: number;
  decaissementsCount: number;
}

export interface EncaissementsResponse {
  data: EncaissementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kpis: EncaissementsKpis;
  lastImportAt: string | null;
  lastImportFile: string | null;
}

export interface EncaissementFilterParams {
  search?: string;
  type?: string;
  account?: string;
  payment_mode?: string;
  client_id?: string | number;
  date_from?: string;
  date_to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface EncaissementFilterOptions {
  accounts: string[];
  paymentModes: string[];
  types: string[];
}

export const encaissementsService = {
  async getEncaissements(params: EncaissementFilterParams = {}): Promise<EncaissementsResponse> {
    const response = await api.get('/encaissements', { params });
    return response.data;
  },

  async getFilterOptions(): Promise<EncaissementFilterOptions> {
    const response = await api.get('/encaissements/filter-options');
    return response.data;
  },
};
