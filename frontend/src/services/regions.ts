import api from './api';
import type { RegionData } from '@/features/regions/types';

export type { RegionData };

export interface RegionsKpiResponse {
  totalRegions: number;
  totalWilayas: number;
  totalDelegates: number;
  totalRevenue: number;
  avgPerformance: number;
  trends: {
    totalRegions: number;
    totalWilayas: number;
    totalDelegates: number;
    totalRevenue: number;
    avgPerformance: number;
  };
}

export interface RegionsAnalyticsResponse {
  regionalRevenue: { name: string; value: number; color?: string }[];
  totalRevenue: number;
  topLeaders: { name: string; region: string; orders: number; revenue: number; completion: number }[];
  wilayaStatus: { label: string; count: number; color: string; textColor: string; bgColor: string }[];
  totalWilayas: number;
}

export interface CreateRegionParams {
  name: string;
  name_fr?: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  bg_color?: string;
  text_color?: string;
  wilaya_codes?: string[];
  delegate_ids?: string[];
}

export interface UpdateRegionParams extends Partial<CreateRegionParams> {
  status?: 'active' | 'inactive' | 'archived';
}

export const regionsService = {
  async list(): Promise<{ data: RegionData[]; total: number }> {
    const { data } = await api.get<{ data: RegionData[]; total: number }>('/regions');
    return data;
  },

  async getKpis(): Promise<RegionsKpiResponse> {
    const { data } = await api.get<RegionsKpiResponse>('/regions/kpis');
    return data;
  },

  async getAnalytics(): Promise<RegionsAnalyticsResponse> {
    const { data } = await api.get<RegionsAnalyticsResponse>('/regions/analytics');
    return data;
  },

  async get(id: string): Promise<RegionData> {
    const { data } = await api.get<{ data: RegionData }>(`/regions/${id}`);
    return data.data;
  },

  async create(payload: CreateRegionParams): Promise<RegionData> {
    const { data } = await api.post<{ data: RegionData }>('/regions', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateRegionParams): Promise<RegionData> {
    const { data } = await api.put<{ data: RegionData }>(`/regions/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/regions/${id}`);
  },
};
