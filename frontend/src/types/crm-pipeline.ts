export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export type LeadSource =
  | 'field_prospection'
  | 'inbound_call'
  | 'recommendation'
  | 'event'
  | 'other';

export interface CrmLead {
  id: number;
  name: string;
  company_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  region: string;
  wilaya: string;
  user_id?: number | null;
  status: LeadStatus;
  source: LeadSource;
  estimated_budget?: number | null;
  converted_client_id?: number | null;
  converted_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    role?: string;
    region?: string;
    wilaya?: string;
  };
  converted_client?: {
    id: number;
    client_code: string;
    name: string;
    status: string;
  };
}

export type OpportunityStage = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export type OpportunityPriority = 'low' | 'medium' | 'high';

export interface CrmOpportunity {
  id: number;
  title: string;
  client_id?: number | null;
  lead_id?: number | null;
  user_id?: number | null;
  amount: number;
  stage: OpportunityStage;
  probability: number;
  priority: OpportunityPriority;
  expected_closing_date?: string | null;
  closed_at?: string | null;
  lost_reason?: string | null;
  converted_order_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    client_code?: string;
    name: string;
    wilaya?: string;
    region?: string;
    phone?: string;
  };
  lead?: {
    id: number;
    name: string;
    company_name: string;
    wilaya?: string;
    region?: string;
    phone?: string;
  };
  user?: {
    id: number;
    name: string;
    role?: string;
    region?: string;
    wilaya?: string;
  };
  converted_order?: {
    id: string;
    order_code: string;
    status: string;
    total_amount: number;
  };
}

export interface PipelineColumns {
  qualification: CrmOpportunity[];
  proposal: CrmOpportunity[];
  negotiation: CrmOpportunity[];
  won: CrmOpportunity[];
  lost: CrmOpportunity[];
}

export interface PipelineKpis {
  total_active_value: number;
  weighted_pipeline_value: number;
  won_amount_month: number;
  won_count_month: number;
  win_rate: number;
  active_deals_count: number;
  total_deals_count: number;
}

export interface CreateLeadParams {
  name: string;
  company_name: string;
  phone: string;
  email?: string;
  address?: string;
  region: string;
  wilaya: string;
  user_id?: number;
  status?: LeadStatus;
  source?: LeadSource;
  estimated_budget?: number;
  notes?: string;
}

export interface ConvertLeadParams {
  client_code?: string;
  client_type?: 'retail' | 'wholesale' | 'corporate' | 'government';
  delegate_id?: number;
  notes?: string;
}

export interface CreateOpportunityParams {
  title: string;
  client_id?: number;
  lead_id?: number;
  user_id?: number;
  amount: number;
  stage?: OpportunityStage;
  probability?: number;
  priority?: OpportunityPriority;
  expected_closing_date?: string;
  notes?: string;
}

export interface UpdateStageParams {
  stage: OpportunityStage;
  lost_reason?: string;
  converted_order_id?: string;
}
