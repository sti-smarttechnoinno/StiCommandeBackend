import api from './api';
import type {
  CreateDeliveryNotePayload,
  DeliveryNoteData,
  DeliveryNoteKpis,
  ListDeliveryNotesParams,
  ListDeliveryNotesResponse,
} from '@/features/delivery-notes/types';

export const deliveryNotesService = {
  list: async (params?: ListDeliveryNotesParams): Promise<ListDeliveryNotesResponse> => {
    const res = await api.get<ListDeliveryNotesResponse>('/delivery-notes', { params });
    return res.data;
  },

  getKpis: async (): Promise<DeliveryNoteKpis> => {
    const res = await api.get<DeliveryNoteKpis>('/delivery-notes/kpis');
    return res.data;
  },

  get: async (id: string): Promise<DeliveryNoteData> => {
    const res = await api.get<{ data: DeliveryNoteData }>(`/delivery-notes/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateDeliveryNotePayload): Promise<DeliveryNoteData> => {
    const res = await api.post<{ data: DeliveryNoteData; message: string }>('/delivery-notes', payload);
    return res.data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<DeliveryNoteData> => {
    const res = await api.put<{ data: DeliveryNoteData; message: string }>(`/delivery-notes/${id}/status`, {
      status,
      notes,
    });
    return res.data.data;
  },
};