import api from './api';

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  description: string;
  permissions: PermissionItem[];
}

export interface RoleData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  has_region_restriction: boolean;
  permissions: string[];
  is_system: boolean;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleFormData {
  name: string;
  slug?: string;
  description?: string;
  has_region_restriction?: boolean;
  permissions?: string[];
}

export const rolesService = {
  async list(): Promise<RoleData[]> {
    const { data } = await api.get<{ data: RoleData[] }>('/roles');
    return data.data;
  },

  async getModules(): Promise<PermissionModule[]> {
    const { data } = await api.get<{ data: PermissionModule[] }>('/roles/modules');
    return data.data;
  },

  async create(payload: RoleFormData): Promise<RoleData> {
    const { data } = await api.post<{ message: string; data: RoleData }>('/roles', payload);
    return data.data;
  },

  async update(id: number, payload: Partial<RoleFormData>): Promise<RoleData> {
    const { data } = await api.put<{ message: string; data: RoleData }>(`/roles/${id}`, payload);
    return data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
};
