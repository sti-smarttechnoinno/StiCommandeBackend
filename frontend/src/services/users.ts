import api from './api';
import type { UserRow, UserRole, UserStatus } from '@/features/users/types';

export interface UserKpiResponse {
  totalUsers: number;
  activeUsers: number;
  systemAdmins: number;
  onlineNow: number;
  securityAlerts: number;
  passwordExpiries: number;
  trends: {
    totalUsers: number;
    activeUsers: number;
    systemAdmins: number;
    onlineNow: number;
    securityAlerts: number;
    passwordExpiries: number;
  };
  sparklines: {
    totalUsers: number[];
    activeUsers: number[];
    systemAdmins: number[];
    onlineNow: number[];
    securityAlerts: number[];
    passwordExpiries: number[];
  };
}

export interface UserAnalyticsResponse {
  roleDistribution: { name: string; value: number }[];
  departmentDistribution: { name: string; value: number }[];
  activeSessions: {
    totalSessions: number;
    desktopSessions: number;
    mobileSessions: number;
  };
  securityEvents: Array<{
    id: string;
    time: string;
    user: string;
    event: string;
    ipAddress: string;
    device: string;
    status: 'success' | 'warning' | 'danger';
  }>;
}

export interface UsersResponse {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsersParams {
  search?: string;
  role?: string[];
  status?: string[];
  region?: string[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const usersService = {
  async list(params: UsersParams = {}): Promise<UsersResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.role?.length) query.role = params.role;
    if (params.status?.length) query.status = params.status;
    if (params.region?.length) query.region = params.region;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page) query.page = params.page;
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<UsersResponse>('/users', { params: query });
    return data;
  },

  async getKpis(): Promise<UserKpiResponse> {
    const { data } = await api.get<UserKpiResponse>('/users/kpis');
    return data;
  },

  async getAnalytics(): Promise<UserAnalyticsResponse> {
    const { data } = await api.get<UserAnalyticsResponse>('/users/analytics');
    return data;
  },

  async get(id: string): Promise<UserRow> {
    const { data } = await api.get<{ data: UserRow }>(`/users/${id}`);
    return data.data;
  },

  async create(user: Partial<UserRow>): Promise<UserRow> {
    const { data } = await api.post<{ data: UserRow }>('/users', user);
    return data.data;
  },

  async update(id: string, user: Partial<UserRow>): Promise<UserRow> {
    const { data } = await api.put<{ data: UserRow }>(`/users/${id}`, user);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async bulkAction(ids: string[], action: string): Promise<void> {
    await api.post('/users/bulk', { ids, action });
  },
};
