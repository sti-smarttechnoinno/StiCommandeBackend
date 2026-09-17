import api from './api';

export interface WarehouseData {
  id: number;
  code: string;
  name: string;
  type: 'central' | 'regional' | 'local' | 'transit';
  address?: string | null;
  wilaya?: string | null;
  region?: string | null;
  capacity?: number | null;
  is_active: boolean;
  is_default: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWarehouseParams {
  code?: string;
  name: string;
  type?: string;
  address?: string;
  wilaya?: string;
  region?: string;
  capacity?: number;
  is_active?: boolean;
  is_default?: boolean;
  notes?: string;
}

export interface UpdateWarehouseParams extends Partial<CreateWarehouseParams> {}

export const warehousesService = {
  async list(params?: { active_only?: boolean; search?: string }): Promise<{ data: WarehouseData[]; total: number }> {
    const { data } = await api.get<{ data: WarehouseData[]; total: number }>('/warehouses', { params });
    return data;
  },

  async get(id: number | string): Promise<WarehouseData> {
    const { data } = await api.get<{ data: WarehouseData }>(`/warehouses/${id}`);
    return data.data;
  },

  async create(payload: CreateWarehouseParams): Promise<WarehouseData> {
    const { data } = await api.post<{ message: string; data: WarehouseData }>('/warehouses', payload);
    return data.data;
  },

  async update(id: number | string, payload: UpdateWarehouseParams): Promise<WarehouseData> {
    const { data } = await api.put<{ message: string; data: WarehouseData }>(`/warehouses/${id}`, payload);
    return data.data;
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  },

  async setDefault(id: number | string): Promise<WarehouseData> {
    const { data } = await api.post<{ message: string; data: WarehouseData }>(`/warehouses/${id}/set-default`);
    return data.data;
  },
};
