export type ReportStatus = 'ready' | 'processing' | 'failed' | 'scheduled';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'print';
export type ReportCategory = 'sales' | 'revenue' | 'delegate' | 'warehouse' | 'stock' | 'client' | 'regional' | 'financial';
export type DateRange = '7d' | '30d' | '90d' | '1y';

export interface RecentReport {
  id: string;
  name: string;
  createdBy: string;
  createdDate: string;
  category: ReportCategory;
  format: ReportFormat;
  status: ReportStatus;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: ReportCategory;
}

export interface ScheduledReport {
  id: string;
  title: string;
  schedule: string;
  status: 'active' | 'paused';
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface RegionRevenue {
  region: string;
  revenue: number;
  percentage: number;
  color: string;
}

export interface DelegateRanking {
  id: string;
  name: string;
  avatar: string;
  region: string;
  revenue: number;
  orders: number;
  completion: number;
  trend: number;
}

export interface SalesTrendPoint {
  month: string;
  sales: number;
  returns: number;
}

export interface BestProduct {
  id: string;
  name: string;
  revenue: number;
  quantitySold: number;
  trend: number;
  category: string;
}

export interface OrdersByStatus {
  name: string;
  value: number;
  color: string;
}

export interface ReportsState {
  dateRange: DateRange;
  searchQuery: string;
  selectedRegion: string;
  selectedWilaya: string;
  selectedDelegate: string;
  selectedWarehouse: string;
  selectedProduct: string;
  selectedReportType: string;
  selectedStatus: string;
  isCreateDialogOpen: boolean;
  refreshKey: number;
  setDateRange: (range: DateRange) => void;
  setSearchQuery: (query: string) => void;
  setSelectedRegion: (region: string) => void;
  setSelectedWilaya: (wilaya: string) => void;
  setSelectedDelegate: (delegate: string) => void;
  setSelectedWarehouse: (warehouse: string) => void;
  setSelectedProduct: (product: string) => void;
  setSelectedReportType: (type: string) => void;
  setSelectedStatus: (status: string) => void;
  setCreateDialogOpen: (open: boolean) => void;
  triggerRefresh: () => void;
  resetFilters: () => void;
}
