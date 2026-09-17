import api from './api';

export interface DelegateData {
  id: string;
  delegateCode?: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  region: string;
  wilaya: string;
  status: 'online' | 'busy' | 'offline' | 'suspended';
  totalOrders: number;
  totalRevenue: number;
  completionRate: number;
  clientCount?: number;
  lastActivity: string;
  createdAt: string;
}

interface DelegatesResponse {
  data: DelegateData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DelegateKpiResponse {
  totalDelegates: number;
  onlineDelegates: number;
  busyDelegates: number;
  offlineDelegates: number;
  ordersToday: number;
  revenueToday: number;
  avgPerformance: number;
  regionsCovered: number;
  trends: {
    totalDelegates: number;
    onlineDelegates: number;
    ordersToday: number;
    revenueToday: number;
    avgPerformance: number;
    regionsCovered: number;
  };
  sparklines: {
    totalDelegates: number[];
    onlineDelegates: number[];
    ordersToday: number[];
    revenueToday: number[];
    avgPerformance: number[];
    regionsCovered: number[];
  };
}

export interface DelegateAnalyticsResponse {
  regionalDistribution: { name: string; value: number; color?: string }[];
  statusCounts: { online: number; busy: number; offline: number; suspended: number };
  topPerformers: { id: string; name: string; region: string; orders: number; revenue: number; completionRate: number }[];
}

export interface DelegateFilterOptionsResponse {
  regions: string[];
  statuses: string[];
}

interface DelegatesParams {
  search?: string;
  status?: string[];
  region?: string[];
  wilaya?: string[];
  dateStart?: string;
  dateEnd?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface UpdateDelegateParams extends Partial<DelegateData> {
  password?: string;
}

export interface MonthlyObjectiveData {
  id?: number | null;
  year: number;
  month: number;
  monthName: string;
  targetRevenue: number;
  achievedRevenue: number; // Volume Objectif (Prix Unitaire Catalogue)
  actualRevenue?: number;  // CA Réalisé Ventes (Net Facturé)
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

export interface DelegateObjectivesResponse {
  delegateId: string;
  delegateName: string;
  currentMonth: MonthlyObjectiveData;
  archive: MonthlyObjectiveData[];
  totalObjectivesCount: number;
}

export interface SetObjectivePayload {
  year: number;
  month: number;
  target_revenue: number;
  target_orders?: number;
  notes?: string;
}

export const delegatesService = {
  async list(params: DelegatesParams = {}): Promise<DelegatesResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.status?.length) query.status = params.status;
    if (params.region?.length) query.region = params.region;
    if (params.wilaya?.length) query.wilaya = params.wilaya;
    if (params.dateStart) query.dateStart = params.dateStart;
    if (params.dateEnd) query.dateEnd = params.dateEnd;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page) query.page = params.page;
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<DelegatesResponse>('/delegates', { params: query });
    return data;
  },

  async getFilterOptions(): Promise<DelegateFilterOptionsResponse> {
    const { data } = await api.get<DelegateFilterOptionsResponse>('/delegates/filter-options');
    return data;
  },

  async getKpis(): Promise<DelegateKpiResponse> {
    const { data } = await api.get<DelegateKpiResponse>('/delegates/kpis');
    return data;
  },

  async getAnalytics(): Promise<DelegateAnalyticsResponse> {
    const { data } = await api.get<DelegateAnalyticsResponse>('/delegates/analytics');
    return data;
  },

  async get(id: string): Promise<DelegateData> {
    const { data } = await api.get<{ data: DelegateData }>(`/delegates/${id}`);
    return data.data;
  },

  async getObjectives(id: string): Promise<DelegateObjectivesResponse> {
    const { data } = await api.get<DelegateObjectivesResponse>(`/delegates/${id}/objectives`);
    return data;
  },

  async setObjective(id: string, payload: SetObjectivePayload): Promise<any> {
    const { data } = await api.post(`/delegates/${id}/objectives`, payload);
    return data;
  },

  async create(delegate: Partial<DelegateData> & { password?: string }): Promise<DelegateData> {
    const { data } = await api.post<{ data: DelegateData }>('/delegates', delegate);
    return data.data;
  },

  async update(id: string, delegate: UpdateDelegateParams): Promise<DelegateData> {
    const { data } = await api.put<{ data: DelegateData }>(`/delegates/${id}`, delegate);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/delegates/${id}`);
  },

  async bulkAction(ids: string[], action: string): Promise<void> {
    await api.post('/delegates/bulk', { ids, action });
  },
};
