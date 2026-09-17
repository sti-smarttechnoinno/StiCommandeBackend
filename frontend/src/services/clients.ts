import api from './api';

export interface ClientData {
  id: string;
  clientCode: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  region: string;
  wilaya: string;
  delegateId?: string;
  delegateName?: string;
  clientType: 'retail' | 'wholesale' | 'corporate' | 'government';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  creditLimit: number;
  outstandingBalance: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  notes?: string;
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
};
