import api from './api';

export interface ClientData {
  id: string;
  clientCode: string;
  name: string;
  email?: string;
  phone: string;
  personalPhone?: string | null;
  stormPhone?: string | null;
  rcNumber?: string | null;
  address: string;
  region: string;
  wilaya: string;
  delegateId?: string | null;
  delegateName?: string | null;
  clientType: 'retail' | 'wholesale' | 'corporate' | 'government';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  creditLimit: number;
  outstandingBalance: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  notes?: string | null;
  createdAt: string;
  objective?: {
    isConfigured: boolean;
    targetRevenue: number;
    achievedRevenue: number;
    revenuePercentage: number;
    targetOrders: number;
    achievedOrders: number;
    monthName?: string;
  };
}

export interface ClientImportColumn {
  key: string;
  label: string;
  sample?: string;
}

export interface ClientImportPreviewResponse {
  file_token: string;
  total_rows: number;
  columns: ClientImportColumn[];
  preview_rows: Record<string, any>[];
  suggested_mapping: Record<string, string>;
}

export interface ClientVerificationSample {
  line: number;
  name: string;
  phone: string;
  storm_phone?: string | null;
  rc_number?: string | null;
  code?: string;
  wilaya?: string;
  region?: string;
  status: 'new' | 'existing' | 'invalid';
  action: 'create' | 'update' | 'skip' | 'error';
  match_reason?: string;
  existing_client?: {
    id: number;
    name: string;
    client_code?: string;
    phone?: string;
    storm_phone?: string | null;
    rc_number?: string | null;
    wilaya?: string;
  } | null;
}

export interface WilayaFileItem {
  file_value: string;
  count: number;
  matched_wilaya_id?: number | null;
  matched_wilaya_name: string;
  matched_wilaya_code: string;
  matched_region: string;
  confidence: 'exact' | 'auto' | 'none';
}

export interface DbWilayaItem {
  id: number;
  code: string;
  name: string;
  region_name: string;
}

export interface WilayaExtractResponse {
  distinct_wilayas: WilayaFileItem[];
  db_wilayas: DbWilayaItem[];
}

export interface RegionFileItem {
  file_value: string;
  count: number;
  matched_region_id?: number | null;
  matched_region_name: string;
  confidence: 'exact' | 'auto' | 'none';
}

export interface DbRegionItem {
  id: number;
  code: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface RegionExtractResponse {
  distinct_regions: RegionFileItem[];
  db_regions: DbRegionItem[];
}

export interface ClientImportVerificationResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  new_clients_count: number;
  existing_clients_count: number;
  to_create_count: number;
  to_update_count: number;
  to_skip_count: number;
  duplicate_action: 'update' | 'skip';
  sample_verifications: ClientVerificationSample[];
  errors: { line: number; error: string }[];
}

export interface ClientImportResult {
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  errors_count: number;
  errors: { line: number; error: string }[];
}

interface ClientsResponse {
  data: ClientData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KpiResponse {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  outstandingCredit?: number;
  targetRevenue?: number;
  ordersThisMonth: number;
  totalRevenue: number;
  trends: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    outstandingCredit?: number;
    targetRevenue?: number;
    ordersThisMonth: number;
    totalRevenue: number;
  };
  sparklines?: {
    totalClients?: number[];
    activeClients?: number[];
    inactiveClients?: number[];
    outstandingCredit?: number[];
    targetRevenue?: number[];
    ordersThisMonth?: number[];
    totalRevenue?: number[];
  };
}

export interface AnalyticsResponse {
  regionalDistribution: { name: string; value: number; color?: string }[];
  objectivePerformance?: { name: string; target: number; achieved: number; percent: number; color?: string }[];
  creditUsage?: { name: string; limit: number; used: number; color?: string }[];
  topDelegates: { name: string; orders: number; revenue: number; completion: number }[];
}

interface ClientsParams {
  search?: string;
  status?: string[];
  region?: string[];
  delegate?: string[];
  clientType?: string[];
  dateStart?: string;
  dateEnd?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ClientMonthlyObjectiveData {
  id?: number | null;
  year: number;
  month: number;
  monthName: string;
  targetRevenue: number;
  achievedRevenue: number;
  remainingRevenue: number;
  revenuePercentage: number;
  targetOrders: number;
  achievedOrders: number;
  ordersPercentage: number;
  notes?: string | null;
  status: 'completed' | 'in_progress' | 'upcoming' | 'missed' | 'not_set';
  isCurrent: boolean;
  isConfigured: boolean;
}

export interface ClientObjectivesResponse {
  clientId: string;
  clientName: string;
  currentMonth: ClientMonthlyObjectiveData;
  archive: ClientMonthlyObjectiveData[];
  totalObjectivesCount: number;
}

export interface SetClientObjectivePayload {
  year: number;
  month: number;
  target_revenue: number;
  target_orders?: number;
  notes?: string;
}

export interface ClientFilterOptionsResponse {
  regions: string[];
  delegates: string[];
  clientTypes: string[];
  statuses: string[];
}

export const clientsService = {
  async list(params: ClientsParams = {}): Promise<ClientsResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.status?.length) query.status = params.status;
    if (params.region?.length) query.region = params.region;
    if (params.delegate?.length) query.delegate = params.delegate;
    if (params.clientType?.length) query.clientType = params.clientType;
    if (params.dateStart) query.dateStart = params.dateStart;
    if (params.dateEnd) query.dateEnd = params.dateEnd;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page) query.page = params.page;
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<ClientsResponse>('/clients', { params: query });
    return data;
  },

  async getFilterOptions(): Promise<ClientFilterOptionsResponse> {
    const { data } = await api.get<ClientFilterOptionsResponse>('/clients/filter-options');
    return data;
  },

  async getKpis(): Promise<KpiResponse> {
    const { data } = await api.get<KpiResponse>('/clients/kpis');
    return data;
  },

  async getAnalytics(): Promise<AnalyticsResponse> {
    const { data } = await api.get<AnalyticsResponse>('/clients/analytics');
    return data;
  },

  async get(id: string): Promise<ClientData> {
    const { data } = await api.get<{ data: ClientData }>(`/clients/${id}`);
    return data.data;
  },

  async getObjectives(id: string): Promise<ClientObjectivesResponse> {
    const { data } = await api.get<ClientObjectivesResponse>(`/clients/${id}/objectives`);
    return data;
  },

  async setObjective(id: string, payload: SetClientObjectivePayload): Promise<any> {
    const { data } = await api.post(`/clients/${id}/objectives`, payload);
    return data;
  },

  async create(client: Partial<ClientData> & { targetRevenue?: number; targetOrders?: number }): Promise<ClientData> {
    const payload = {
      ...client,
      client_type: client.clientType,
      credit_limit: client.creditLimit,
      outstanding_balance: client.outstandingBalance,
      target_revenue: client.targetRevenue,
      target_orders: client.targetOrders,
      delegate_id: client.delegateId && !isNaN(Number(client.delegateId)) ? Number(client.delegateId) : undefined,
      delegate_name: client.delegateName,
      delegateName: client.delegateName,
      client_code: client.clientCode,
      rc_number: client.rcNumber || (client as any).rc_number || undefined,
      rcNumber: client.rcNumber || (client as any).rc_number || undefined,
    };
    const { data } = await api.post<{ data: ClientData }>('/clients', payload);
    return data.data;
  },

  async update(id: string, client: Partial<ClientData>): Promise<ClientData> {
    const { data } = await api.put<{ data: ClientData }>(`/clients/${id}`, client);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  async bulkAction(ids: string[], action: string, delegateId?: string): Promise<void> {
    await api.post('/clients/bulk', { ids, action, delegate_id: delegateId });
  },

  async importPreview(file: File): Promise<ClientImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ data: ClientImportPreviewResponse }>('/clients/import-preview', formData, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return data.data;
  },

  async extractWilayas(payload: {
    file_token: string;
    wilaya_column: string;
  }): Promise<WilayaExtractResponse> {
    const { data } = await api.post<{ data: WilayaExtractResponse }>('/clients/import-extract-wilayas', payload);
    return data.data;
  },

  async extractRegions(payload: {
    file_token: string;
    region_column: string;
  }): Promise<RegionExtractResponse> {
    const { data } = await api.post<{ data: RegionExtractResponse }>('/clients/import-extract-regions', payload);
    return data.data;
  },

  async importVerify(payload: {
    file_token: string;
    mapping: Record<string, string>;
    duplicate_action: 'update' | 'skip';
    wilaya_mapping?: Record<string, string>;
    region_mapping?: Record<string, string>;
  }): Promise<ClientImportVerificationResult> {
    const { data } = await api.post<{ data: ClientImportVerificationResult }>('/clients/import-verify', payload, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return data.data;
  },

  async importExecute(payload: {
    file_token: string;
    mapping: Record<string, string>;
    duplicate_action: 'update' | 'skip';
    wilaya_mapping?: Record<string, string>;
    region_mapping?: Record<string, string>;
  }): Promise<{ message: string; data: ClientImportResult }> {
    const { data } = await api.post<{ message: string; data: ClientImportResult }>('/clients/import-execute', payload, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return data;
  },

  async importEncaissements(payloadOrForm: FormData | { use_data_folder?: boolean }): Promise<any> {
    const { data } = await api.post('/clients/import-encaissements', payloadOrForm, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return data;
  },

  async importRecouvrement(
    fileOrOptions?: File | FormData | { use_data_folder?: boolean; create_missing?: boolean },
    createMissing: boolean = true
  ): Promise<any> {
    if (typeof FormData !== 'undefined' && fileOrOptions instanceof FormData) {
      const { data } = await api.post('/clients/import-recouvrement', fileOrOptions, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    if (typeof File !== 'undefined' && fileOrOptions instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrOptions);
      formData.append('create_missing', createMissing ? '1' : '0');
      const { data } = await api.post('/clients/import-recouvrement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    const { data } = await api.post('/clients/import-recouvrement', fileOrOptions || {});
    return data;
  },
};
