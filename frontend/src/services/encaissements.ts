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
  is_last?: boolean;
  only_last?: boolean;
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

export interface EncaissementImportColumn {
  key: string;
  label: string;
  sample?: string;
}

export interface EncaissementImportPreviewResponse {
  file_token: string;
  file_name: string;
  total_rows: number;
  columns: EncaissementImportColumn[];
  preview_rows: Record<string, any>[];
  suggested_mapping: Record<string, string>;
}

export interface EncaissementClientMatchSample {
  tiers_name: string;
  status: 'matched' | 'unmatched';
  operations_count: number;
  total_credit: number;
  total_debit: number;
  matched_client?: {
    id: number;
    name: string;
    client_code: string;
    wilaya?: string;
    region?: string;
  } | null;
}

export interface EncaissementImportVerificationResult {
  total_rows: number;
  unique_tiers_count: number;
  matched_clients_count: number;
  unmatched_clients_count: number;
  total_credit: number;
  total_debit: number;
  unmatched_action: 'link_only' | 'create' | 'skip';
  samples: EncaissementClientMatchSample[];
}

export interface EncaissementImportResult {
  total_rows_processed: number;
  encaissements_imported: number;
  rows_skipped: number;
  clients_matched: number;
  clients_created: number;
  total_amount_credited: number;
  total_amount_debited: number;
  duration_seconds: number;
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

  async previewImport(fileOrOptions?: File | FormData | { use_data_folder?: boolean }): Promise<EncaissementImportPreviewResponse> {
    let payload: any = fileOrOptions;
    let headers: Record<string, string> = { 'Accept': 'application/json' };

    if (fileOrOptions instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrOptions);
      payload = formData;
      headers['Content-Type'] = 'multipart/form-data';
    } else if (fileOrOptions instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    const { data } = await api.post<{ success: boolean; data: EncaissementImportPreviewResponse }>(
      '/encaissements/import-preview',
      payload || { use_data_folder: true },
      { headers }
    );
    return data.data;
  },

  async verifyImport(payload: {
    file_token: string;
    mapping: Record<string, string>;
    unmatched_action?: 'link_only' | 'create' | 'skip';
  }): Promise<EncaissementImportVerificationResult> {
    const { data } = await api.post<{ success: boolean; data: EncaissementImportVerificationResult }>(
      '/encaissements/import-verify',
      payload,
      { headers: { 'Accept': 'application/json' } }
    );
    return data.data;
  },

  async executeImport(payload: {
    file_token: string;
    mapping: Record<string, string>;
    unmatched_action?: 'link_only' | 'create' | 'skip';
  }): Promise<{ message: string; data: EncaissementImportResult }> {
    const { data } = await api.post<{ message: string; data: EncaissementImportResult }>(
      '/encaissements/import-execute',
      payload,
      { headers: { 'Accept': 'application/json' } }
    );
    return data;
  },
};

