import api from './api';
import type {
  CrmQuote,
  QuoteKpis,
  CreateQuoteParams,
  ListQuotesParams,
  ListQuotesResponse,
  QuoteStatus,
} from '@/types/crm-quotes';

export const crmQuotesService = {
  list: async (params?: ListQuotesParams): Promise<ListQuotesResponse> => {
    const res = await api.get<ListQuotesResponse>('/crm/quotes', { params });
    return res.data;
  },

  get: async (id: number): Promise<CrmQuote> => {
    const res = await api.get<CrmQuote>(`/crm/quotes/${id}`);
    return res.data;
  },

  getKpis: async (params?: { region?: string; user_id?: number }): Promise<QuoteKpis> => {
    const res = await api.get<QuoteKpis>('/crm/quotes/kpis', { params });
    return res.data;
  },

  create: async (data: CreateQuoteParams): Promise<CrmQuote> => {
    const res = await api.post<{ message: string; quote: CrmQuote }>('/crm/quotes', data);
    return res.data.quote;
  },

  update: async (id: number, data: Partial<CreateQuoteParams>): Promise<CrmQuote> => {
    const res = await api.put<{ message: string; quote: CrmQuote }>(`/crm/quotes/${id}`, data);
    return res.data.quote;
  },

  updateStatus: async (id: number, status: QuoteStatus): Promise<CrmQuote> => {
    const res = await api.patch<{ message: string; quote: CrmQuote }>(`/crm/quotes/${id}/status`, {
      status,
    });
    return res.data.quote;
  },

  convertToOrder: async (id: number): Promise<{ message: string; order: any; quote: CrmQuote }> => {
    const res = await api.post<{ message: string; order: any; quote: CrmQuote }>(
      `/crm/quotes/${id}/convert-to-order`
    );
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/crm/quotes/${id}`);
  },
};
