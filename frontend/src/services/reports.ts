import api from './api';

export interface ReportsKPIs {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  pendingOrders: number;
  pendingGrowth: number;
  avgOrderValue: number;
  avgOrderGrowth: number;
  activeClients: number;
  activeDelegates: number;
  ordersSparkline?: number[];
  revenueSparkline?: number[];
  pendingSparkline?: number[];
  delegatesSparkline?: number[];
}

export interface RevenueOverviewData {
  month: string;
  revenue: number;
  orders: number;
  target: number;
}

export interface RegionalRevenueData {
  region: string;
  revenue: number;
  orders: number;
  color: string;
}

export interface SalesTrendData {
  date: string;
  sales: number;
  volume: number;
}

export interface OrderStatusData {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopDelegateData {
  id: string;
  name: string;
  sales: number;
  orders: number;
  region: string;
  targetAchievement: number;
}

export interface BestProductData {
  id: string;
  name: string;
  sales: number;
  units: number;
  category: string;
  growth: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  period: string;
  format: string;
  status: string;
  fileSize: string;
  createdAt: string;
  author: string;
}

export interface ReportsListParams {
  search?: string;
  type?: string;
  format?: string;
  page?: number;
  pageSize?: number;
}

export const reportsService = {
  async getKpis(): Promise<ReportsKPIs> {
    const res = await api.get<ReportsKPIs>('/reports/kpis');
    return res.data;
  },

  async getRevenueOverview(range: string = '30d'): Promise<RevenueOverviewData[]> {
    const res = await api.get<RevenueOverviewData[]>('/reports/revenue-overview', { params: { range } });
    return res.data;
  },

  async getRevenueByRegion(): Promise<RegionalRevenueData[]> {
    const res = await api.get<RegionalRevenueData[]>('/reports/by-region');
    return res.data;
  },

  async getSalesTrends(): Promise<SalesTrendData[]> {
    const res = await api.get<SalesTrendData[]>('/reports/sales-trends');
    return res.data;
  },

  async getOrderStatusDistribution(): Promise<OrderStatusData[]> {
    const res = await api.get<OrderStatusData[]>('/reports/order-status');
    return res.data;
  },

  async getTopDelegates(): Promise<TopDelegateData[]> {
    const res = await api.get<TopDelegateData[]>('/reports/top-delegates');
    return res.data;
  },

  async getBestProducts(): Promise<BestProductData[]> {
    const res = await api.get<BestProductData[]>('/reports/best-products');
    return res.data;
  },

  async listReports(params: ReportsListParams = {}): Promise<{
    data: GeneratedReport[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const res = await api.get('/reports', { params });
    return res.data;
  },

  async createReport(data: {
    name: string;
    type: string;
    period: string;
    format: string;
  }): Promise<GeneratedReport> {
    const res = await api.post<GeneratedReport>('/reports', data);
    return res.data;
  },

  async deleteReport(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },

  async bulkAction(action: string, ids: string[]): Promise<void> {
    await api.post('/reports/bulk', { action, ids });
  },
};
