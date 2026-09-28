export type VisitStatus = 'planned' | 'completed' | 'cancelled' | 'missed';

export type VisitPurpose = 'order_taking' | 'prospecting' | 'debt_collection' | 'relationship' | 'claim';

export type InteractionType = 'call' | 'visit' | 'whatsapp' | 'email' | 'note' | 'complaint';

export interface CrmVisit {
  id: number;
  client_id: number;
  user_id: number;
  planned_at: string;
  completed_at?: string | null;
  status: VisitStatus;
  purpose: VisitPurpose;
  summary?: string | null;
  checkin_latitude?: number | null;
  checkin_longitude?: number | null;
  checkin_address?: string | null;
  resulting_order_id?: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    client_code?: string;
    phone?: string;
    region?: string;
    wilaya?: string;
    address?: string;
  };
  user?: {
    id: number;
    name: string;
    role?: string;
    region?: string;
    wilaya?: string;
  };
  resulting_order?: {
    id: string;
    order_code: string;
    total_amount: number;
    status: string;
  };
}

export interface CrmInteraction {
  id: number;
  client_id: number;
  user_id: number;
  type: InteractionType;
  title: string;
  notes?: string | null;
  interaction_date: string;
  crm_visit_id?: number | null;
  created_at: string;
  client?: {
    id: number;
    name: string;
    client_code?: string;
    phone?: string;
    region?: string;
    wilaya?: string;
  };
  user?: {
    id: number;
    name: string;
    role?: string;
  };
}

export interface CrmVisitKpis {
  todayPlanned: number;
  todayCompleted: number;
  monthPlanned: number;
  monthCompleted: number;
  completionRate: number;
  purposeStats: Record<VisitPurpose, number>;
}

export interface ListVisitsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  purpose?: string;
  client_id?: number | string;
  user_id?: number | string;
  region?: string;
  date_from?: string;
  date_to?: string;
  today_only?: boolean;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ListVisitsResponse {
  data: CrmVisit[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListInteractionsParams {
  page?: number;
  pageSize?: number;
  client_id?: number | string;
  type?: string;
}

export interface ListInteractionsResponse {
  data: CrmInteraction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
