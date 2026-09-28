import api from './api';
import type {
  CrmVisit,
  CrmInteraction,
  CrmVisitKpis,
  ListVisitsParams,
  ListVisitsResponse,
  ListInteractionsParams,
  ListInteractionsResponse,
  VisitPurpose,
  InteractionType,
} from '@/types/crm';

export const crmVisitsService = {
  list: async (params?: ListVisitsParams): Promise<ListVisitsResponse> => {
    const res = await api.get<ListVisitsResponse>('/crm/visits', { params });
    return res.data;
  },

  getKpis: async (params?: { region?: string }): Promise<CrmVisitKpis> => {
    const res = await api.get<CrmVisitKpis>('/crm/visits/kpis', { params });
    return res.data;
  },

  get: async (id: number): Promise<CrmVisit> => {
    const res = await api.get<{ data: CrmVisit }>(`/crm/visits/${id}`);
    return res.data.data;
  },

  create: async (data: {
    client_id: number;
    user_id?: number;
    planned_at: string;
    purpose: VisitPurpose;
    summary?: string;
  }): Promise<CrmVisit> => {
    const res = await api.post<{ data: CrmVisit }>('/crm/visits', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<CrmVisit>): Promise<CrmVisit> => {
    const res = await api.put<{ data: CrmVisit }>(`/crm/visits/${id}`, data);
    return res.data.data;
  },

  complete: async (
    id: number,
    data: {
      summary: string;
      checkin_latitude?: number | null;
      checkin_longitude?: number | null;
      checkin_address?: string | null;
      resulting_order_id?: string | null;
    }
  ): Promise<CrmVisit> => {
    const res = await api.post<{ data: CrmVisit }>(`/crm/visits/${id}/complete`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/crm/visits/${id}`);
  },
};

export const crmInteractionsService = {
  list: async (params?: ListInteractionsParams): Promise<ListInteractionsResponse> => {
    const res = await api.get<ListInteractionsResponse>('/crm/interactions', { params });
    return res.data;
  },

  create: async (data: {
    client_id: number;
    type: InteractionType;
    title: string;
    notes?: string;
    interaction_date?: string;
  }): Promise<CrmInteraction> => {
    const res = await api.post<{ data: CrmInteraction }>('/crm/interactions', data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/crm/interactions/${id}`);
  },
};
