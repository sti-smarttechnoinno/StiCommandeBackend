import api from './api';
import type { WilayaRow, RegionId, WilayaStatus, SortField, SortDirection } from '@/features/wilayas/types';

export interface WilayaData extends WilayaRow {}

export interface WilayasResponse {
  data: WilayaRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WilayasKpiResponse {
  totalWilayas: number;
  totalClients: number;
  monthlyRevenue: number;
  ordersThisMonth: number;
  activeDelegates: number;
  averageGrowth: number;
  trends: {
    totalWilayas: number;
    totalClients: number;
    monthlyRevenue: number;
    ordersThisMonth: number;
    activeDelegates: number;
    averageGrowth: number;
  };
  sparklines: {
    totalWilayas: number[];
    totalClients: number[];
    monthlyRevenue: number[];
    ordersThisMonth: number[];
    activeDelegates: number[];
    averageGrowth: number[];
  };
}

export interface WilayasAnalyticsResponse {
  regionalDistribution: { name: string; revenue: number; color: string; wilayas: number }[];
  topPerformers: {
    id: string;
    code: string;
    name: string;
    monthlyRevenue: number;
    ordersMonth: number;
    growth: number;
  }[];
  performanceCounts: {
    excellent: number;
    good: number;
    average: number;
    needs_attention: number;
  };
}

export interface WilayasQueryParams {
  search?: string;
  region?: RegionId[];
  status?: WilayaStatus[];
  revenueRange?: string;
  growth?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

export const wilayasService = {
  async list(params: WilayasQueryParams = {}): Promise<WilayasResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.region?.length) query.region = params.region;
    if (params.status?.length) query.status = params.status;
    if (params.revenueRange && params.revenueRange !== 'all') query.revenueRange = params.revenueRange;
    if (params.growth && params.growth !== 'all') query.growth = params.growth;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page !== undefined) query.page = params.page + 1; // 1-indexed for backend API
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<WilayasResponse>('/wilayas', { params: query });
    return data;
  },

  async getKpis(): Promise<WilayasKpiResponse> {
    const { data } = await api.get<WilayasKpiResponse>('/wilayas/kpis');
    return data;
  },

  async getAnalytics(): Promise<WilayasAnalyticsResponse> {
    const { data } = await api.get<WilayasAnalyticsResponse>('/wilayas/analytics');
    return data;
  },

  async get(id: string): Promise<WilayaRow> {
    const { data } = await api.get<{ data: WilayaRow }>(`/wilayas/${id}`);
    return data.data;
  },

  async create(wilaya: Partial<WilayaRow>): Promise<WilayaRow> {
    const payload = {
      code: wilaya.code,
      name: wilaya.name,
      region_id: wilaya.regionId,
      region_name: wilaya.regionName,
      clients_count: wilaya.clients,
      orders_month: wilaya.ordersMonth,
      monthly_revenue: wilaya.monthlyRevenue,
      status: wilaya.status,
    };
    const { data } = await api.post<{ data: WilayaRow }>('/wilayas', payload);
    return data.data;
  },

  async update(id: string, wilaya: Partial<WilayaRow>): Promise<WilayaRow> {
    const payload = {
      name: wilaya.name,
      region_id: wilaya.regionId,
      region_name: wilaya.regionName,
      clients_count: wilaya.clients,
      orders_month: wilaya.ordersMonth,
      monthly_revenue: wilaya.monthlyRevenue,
      status: wilaya.status,
    };
    const { data } = await api.put<{ data: WilayaRow }>(`/wilayas/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/wilayas/${id}`);
  },

  async bulkAction(ids: string[], action: 'active' | 'limited' | 'inactive' | 'delete'): Promise<void> {
    await api.post('/wilayas/bulk', { ids, action });
  },
};
