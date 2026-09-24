import api from './api';

export interface AssignableUser {
  id: number;
  name: string;
  email: string;
  role: string;
  region_id?: number | null;
  region_name?: string | null;
  avatar?: string | null;
}

export interface UserObjective {
  id: number;
  delegate_id?: number;
  user_id?: number;
  year: number;
  month: number;
  target_revenue: number;
  target_orders: number;
  notes?: string | null;
  assigned_by?: number | null;
  assignee_name: string;
  user_name?: string;
  assignee_role: string;
  assigned_by_name?: string | null;
  region_name?: string | null;
  actual_revenue: number;
  actual_orders: number;
  revenue_progress: number;
  orders_progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserTask {
  id: number;
  title: string;
  description?: string | null;
  assigned_by: number;
  assigned_to: number;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'validated' | 'problem' | 'cancelled';
  due_date?: string | null;
  completed_at?: string | null;
  completion_notes?: string | null;
  is_private?: boolean;
  has_file_attribution: boolean;
  has_attachment?: boolean;
  file_path?: string | null;
  file_name?: string | null;
  attachment_name?: string | null;
  file_url?: string | null;
  attachment_url?: string | null;
  file_size?: number | null;
  file_mime?: string | null;
  assigned_by_name?: string | null;
  assigned_to_name?: string | null;
  assigned_to_role?: string | null;
  assigned_to_region?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface TaskHistoryItem {
  id: number;
  task_id: number;
  action: string;
  performed_by: number;
  from_status?: string | null;
  to_status?: string | null;
  notes?: string | null;
  comment?: string | null;
  has_file: boolean;
  file_path?: string | null;
  file_name?: string | null;
  attachment_name?: string | null;
  file_url?: string | null;
  performed_by_name?: string | null;
  user_name?: string | null;
  task_title?: string;
  created_at: string;
  task?: {
    id: number;
    title: string;
    assigned_to_name?: string;
    assigned_by_name?: string;
  };
}

export interface BatchObjectivePayload {
  user_ids: number[];
  year: number;
  month: number;
  target_revenue: number;
  target_orders: number;
  notes?: string;
}

export interface TasksListResponse {
  data: UserTask[];
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    validated: number;
    problem: number;
    cancelled: number;
    private_count?: number;
  };
}

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: number;
  assigned_by?: number;
  has_file?: boolean | string;
  is_private?: boolean | string;
  only_private?: boolean | string;
  scope?: string;
  search?: string;
}

export const objectivesService = {
  /**
   * Get list of users the current logged-in user can assign tasks/objectives to
   */
  async getAssignableUsers(): Promise<AssignableUser[]> {
    const { data } = await api.get<any>('/objectives/assignable-users');
    if (Array.isArray(data)) return data;
    return data?.data || data?.users || [];
  },

  /**
   * List objectives for a month/year
   */
  async getObjectives(year?: number, month?: number): Promise<UserObjective[]> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const { data } = await api.get<any>('/objectives', { params });
    if (Array.isArray(data)) return data;
    return data?.objectives || data?.data || [];
  },

  /**
   * Batch assign objectives to selected users
   */
  async batchAssignObjectives(payload: BatchObjectivePayload): Promise<{ success: boolean; count: number }> {
    const { data } = await api.post<{ success: boolean; count: number; message: string }>('/objectives/batch-assign', payload);
    return data;
  },

  /**
   * Get user tasks with filters & statistics
   */
  async getTasks(filters?: TaskFilterParams): Promise<TasksListResponse> {
    const { data } = await api.get<any>('/tasks', { params: filters });
    const tasksList = Array.isArray(data)
      ? data
      : (data?.tasks || data?.data || []);
    const statsObj = data?.stats || {
      total: tasksList.length,
      pending: tasksList.filter((t: any) => t.status === 'pending').length,
      in_progress: tasksList.filter((t: any) => t.status === 'in_progress').length,
      completed: tasksList.filter((t: any) => t.status === 'completed').length,
      validated: tasksList.filter((t: any) => t.status === 'validated').length,
      problem: tasksList.filter((t: any) => t.status === 'problem').length,
      cancelled: tasksList.filter((t: any) => t.status === 'cancelled').length,
    };
    return {
      data: tasksList,
      stats: statsObj,
    };
  },

  /**
   * Create task(s) with optional file attribution (multipart/form-data)
   */
  async createTask(formData: FormData): Promise<{ success: boolean; count: number; tasks: UserTask[] }> {
    const { data } = await api.post<{ success: boolean; count: number; tasks: UserTask[] }>('/tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Update task status (with optional completion notes)
   */
  async updateTaskStatus(
    id: number,
    status: 'pending' | 'in_progress' | 'completed' | 'validated' | 'problem' | 'cancelled',
    notes?: string
  ): Promise<UserTask> {
    const { data } = await api.put<{ success: boolean; task: UserTask }>(`/tasks/${id}/status`, {
      status,
      completion_notes: notes,
      notes,
    });
    return data.task;
  },

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Get audit trail / history for tasks
   */
  async getTaskHistory(taskId?: number): Promise<TaskHistoryItem[]> {
    const params: Record<string, number> = {};
    if (taskId) params.task_id = taskId;
    const { data } = await api.get<any>('/tasks/history', { params });
    if (Array.isArray(data)) return data;
    return data?.history || data?.data || [];
  },
};
