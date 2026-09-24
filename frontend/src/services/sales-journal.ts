import api from './api';

export interface SalesJournalRecord {
  id: number;
  import_id?: number | null;
  client_id?: number | null;
  delegate_id?: number | null;
  reference: string;
  type: string;
  status: string;
  operation_date: string | null;
  tiers_name: string;
  client_code?: string | null;
  wilaya?: string | null;
  region?: string | null;
  amount_ht: number;
  discount_pct: number;
  net_ht: number;
  tva: number;
  timbre: number;
  total_ttc: number;
  paid_amount: number;
  remaining_amount: number;
  payment_mode?: string | null;
  currency?: string;
  depot_source?: string | null;
  depot_destination?: string | null;
  created_by_erp?: string | null;
  created_at_erp?: string | null;
  locked: boolean;
  created_at?: string;
  updated_at?: string;
  client?: {
    id: number;
    client_code: string;
    name: string;
    phone?: string;
    wilaya?: string;
    region?: string;
    outstanding_balance?: number;
  } | null;
  delegate?: {
    id: number;
    name: string;
  } | null;
}

export interface SalesJournalKpis {
  totalTtc: number;
  totalNetHt: number;
  totalPaid: number;
  totalRemaining: number;
  totalOperations: number;
  matchedCount: number;
  unmatchedCount: number;
  recoveryRate: number;
  matchRate: number;
  targetRevenue?: number;
  achievementRate?: number | null;
}

export interface SalesJournalResponse {
  data: SalesJournalRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kpis: SalesJournalKpis;
  lastImport?: {
    id: number;
    fileName: string;
    rowsCount: number;
    matchedClientsCount: number;
    createdAt: string | null;
  } | null;
}

export interface SalesJournalFilterParams {
  search?: string;
  delegate_id?: string | number;
  client_id?: string | number;
  wilaya?: string;
  region?: string;
  payment_mode?: string;
  type?: string;
  depot?: string;
  status?: string;
  matched?: string;
  only_remaining?: boolean;
  date_from?: string;
  date_to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SalesJournalFilterOptions {
  types: string[];
  paymentModes: string[];
  depots: string[];
  statuses: string[];
  wilayas: string[];
  regions: string[];
  delegates: { id: number; name: string; wilaya?: string; region?: string }[];
}

export interface SalesJournalImportColumn {
  key: string;
  label: string;
  sample?: string;
}

export interface SalesJournalImportPreviewResponse {
  file_token: string;
  file_name: string;
  total_rows: number;
  columns: SalesJournalImportColumn[];
  preview_rows: Record<string, any>[];
  suggested_mapping: Record<string, string>;
}

export interface SalesJournalClientMatchSample {
  tiers_name: string;
  status: 'matched' | 'unmatched';
  operations_count: number;
  total_ttc: number;
  total_paid: number;
  total_remaining: number;
  matched_client?: {
    id: number;
    name: string;
    client_code: string;
    wilaya?: string;
    region?: string;
    delegate?: string | null;
  } | null;
}

export interface SalesJournalDuplicateSample {
  reference: string;
  tiers_name: string;
  total_ttc: number;
  operation_date: string | null;
}

export interface SalesJournalImportVerifyResponse {
  total_rows: number;
  unique_tiers_count: number;
  matched_clients_count: number;
  unmatched_clients_count: number;
  existing_duplicates_count: number;
  inbound_duplicates_count: number;
  sample_duplicates: SalesJournalDuplicateSample[];
  total_ttc: number;
  total_paid: number;
  total_remaining: number;
  unmatched_action: string;
  samples: SalesJournalClientMatchSample[];
}

export interface SalesJournalImportExecuteResponse {
  success: boolean;
  import_id: number;
  rows_count: number;
  matched_clients_count: number;
  unmatched_clients_count: number;
  duplicate_action: 'skip' | 'update';
  skipped_duplicates_count: number;
  updated_duplicates_count: number;
  total_amount_ttc: number;
  total_paid: number;
  total_remaining: number;
  duration_seconds: number;
}

export const salesJournalService = {
  getSalesJournal: async (params?: SalesJournalFilterParams): Promise<SalesJournalResponse> => {
    const res = await api.get('/sales-journal', { params });
    return res.data;
  },

  getFilterOptions: async (): Promise<SalesJournalFilterOptions> => {
    const res = await api.get('/sales-journal/filter-options');
    return res.data;
  },

  previewImport: async (file?: File, filePath?: string): Promise<SalesJournalImportPreviewResponse> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/sales-journal/import-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
    const res = await api.post('/sales-journal/import-preview', { file_path: filePath });
    return res.data;
  },

  verifyImport: async (
    fileToken: string,
    mapping: Record<string, string>,
    unmatchedAction: 'link_only' | 'create_missing' = 'link_only'
  ): Promise<SalesJournalImportVerifyResponse> => {
    const res = await api.post('/sales-journal/import-verify', {
      file_token: fileToken,
      mapping,
      unmatched_action: unmatchedAction,
    });
    return res.data;
  },

  executeImport: async (
    fileToken: string,
    mapping: Record<string, string>,
    unmatchedAction: 'link_only' | 'create_missing' = 'link_only',
    duplicateAction: 'skip' | 'update' = 'skip'
  ): Promise<SalesJournalImportExecuteResponse> => {
    const res = await api.post('/sales-journal/import-execute', {
      file_token: fileToken,
      mapping,
      unmatched_action: unmatchedAction,
      duplicate_action: duplicateAction,
    });
    return res.data;
  },

  exportCsv: (params?: SalesJournalFilterParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const baseUrl = api.defaults.baseURL || '/api';
    window.open(`${baseUrl}/sales-journal/export?${query.toString()}`, '_blank');
  },
};
