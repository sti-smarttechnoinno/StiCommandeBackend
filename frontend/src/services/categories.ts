import api from './api';

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  workflow_type?: 'virtual' | 'physical';
  requires_delivery?: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const categoriesService = {
  async list(params?: { active_only?: boolean; search?: string }): Promise<{ data: CategoryData[] }> {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async create(data: Partial<CategoryData>): Promise<{ data: CategoryData; message: string }> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(id: number, data: Partial<CategoryData>): Promise<{ data: CategoryData; message: string }> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
