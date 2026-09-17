import api from './api';

export interface OperatorData {
  id: number;
  name: string;
  code: string;
  color?: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const operatorsService = {
  async list(params?: { active_only?: boolean; search?: string }): Promise<{ data: OperatorData[] }> {
    const response = await api.get('/operators', { params });
    return response.data;
  },

  async create(data: Partial<OperatorData>): Promise<{ data: OperatorData; message: string }> {
    const response = await api.post('/operators', data);
    return response.data;
  },

  async update(id: number, data: Partial<OperatorData>): Promise<{ data: OperatorData; message: string }> {
    const response = await api.put(`/operators/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/operators/${id}`);
    return response.data;
  },
};
