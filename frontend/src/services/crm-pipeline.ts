import api from './api';
import type {
  CrmLead,
  CrmOpportunity,
  PipelineColumns,
  PipelineKpis,
  CreateLeadParams,
  ConvertLeadParams,
  CreateOpportunityParams,
  UpdateStageParams,
  LeadStatus,
  LeadSource,
  OpportunityStage,
  OpportunityPriority,
} from '@/types/crm-pipeline';

export interface ListLeadsParams {
  page?: number;
  per_page?: number;
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
  region?: string;
  user_id?: number;
  search?: string;
}

export interface ListLeadsResponse {
  data: CrmLead[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ListOpportunitiesParams {
  page?: number;
  per_page?: number;
  stage?: OpportunityStage | 'all';
  priority?: OpportunityPriority | 'all';
  region?: string;
  user_id?: number;
  client_id?: number;
  lead_id?: number;
  search?: string;
  grouped?: boolean;
}

export const crmLeadsService = {
  list: async (params?: ListLeadsParams): Promise<ListLeadsResponse> => {
    const res = await api.get<ListLeadsResponse>('/crm/leads', { params });
    return res.data;
  },

  get: async (id: number): Promise<CrmLead> => {
    const res = await api.get<CrmLead>(`/crm/leads/${id}`);
    return res.data;
  },

  create: async (data: CreateLeadParams): Promise<CrmLead> => {
    const res = await api.post<{ message: string; lead: CrmLead }>('/crm/leads', data);
    return res.data.lead;
  },

  update: async (id: number, data: Partial<CreateLeadParams>): Promise<CrmLead> => {
    const res = await api.put<{ message: string; lead: CrmLead }>(`/crm/leads/${id}`, data);
    return res.data.lead;
  },

  convert: async (id: number, data?: ConvertLeadParams): Promise<{ client: any; lead: CrmLead }> => {
    const res = await api.post<{ message: string; client: any; lead: CrmLead }>(
      `/crm/leads/${id}/convert`,
      data || {}
    );
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/crm/leads/${id}`);
  },
};

export const crmOpportunitiesService = {
  listKanban: async (params?: Omit<ListOpportunitiesParams, 'grouped'>): Promise<{ columns: PipelineColumns; total: number }> => {
    const res = await api.get<{ columns: PipelineColumns; total: number }>('/crm/opportunities', {
      params: { ...params, grouped: true },
    });
    return res.data;
  },

  list: async (params?: ListOpportunitiesParams): Promise<{ data: CrmOpportunity[]; total: number }> => {
    const res = await api.get<{ data: CrmOpportunity[]; total: number }>('/crm/opportunities', {
      params: { ...params, grouped: false },
    });
    return res.data;
  },

  getKpis: async (params?: { region?: string; user_id?: number }): Promise<PipelineKpis> => {
    const res = await api.get<PipelineKpis>('/crm/opportunities/kpis', { params });
    return res.data;
  },

  get: async (id: number): Promise<CrmOpportunity> => {
    const res = await api.get<CrmOpportunity>(`/crm/opportunities/${id}`);
    return res.data;
  },

  create: async (data: CreateOpportunityParams): Promise<CrmOpportunity> => {
    const res = await api.post<{ message: string; opportunity: CrmOpportunity }>(
      '/crm/opportunities',
      data
    );
    return res.data.opportunity;
  },

  update: async (id: number, data: Partial<CreateOpportunityParams & { lost_reason?: string; converted_order_id?: string }>): Promise<CrmOpportunity> => {
    const res = await api.put<{ message: string; opportunity: CrmOpportunity }>(
      `/crm/opportunities/${id}`,
      data
    );
    return res.data.opportunity;
  },

  updateStage: async (id: number, data: UpdateStageParams): Promise<CrmOpportunity> => {
    const res = await api.patch<{ message: string; opportunity: CrmOpportunity }>(
      `/crm/opportunities/${id}/stage`,
      data
    );
    return res.data.opportunity;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/crm/opportunities/${id}`);
  },
};
