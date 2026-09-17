import type {
  RecentReport,
  ReportTemplate,
  ScheduledReport,
  RevenueDataPoint,
  RegionRevenue,
  DelegateRanking,
  SalesTrendPoint,
  BestProduct,
  OrdersByStatus,
} from '../types';

export const MOCK_REVENUE_DATA: Record<string, RevenueDataPoint[]> = {
  '7d': [
    { date: 'Mon', revenue: 2400000, orders: 142 },
    { date: 'Tue', revenue: 2800000, orders: 168 },
    { date: 'Wed', revenue: 2200000, orders: 131 },
    { date: 'Thu', revenue: 3100000, orders: 189 },
    { date: 'Fri', revenue: 2900000, orders: 175 },
    { date: 'Sat', revenue: 3400000, orders: 203 },
    { date: 'Sun', revenue: 2600000, orders: 156 },
  ],
  '30d': Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    revenue: 2000000 + Math.floor(Math.random() * 2000000),
    orders: 120 + Math.floor(Math.random() * 100),
  })),
  '90d': Array.from({ length: 12 }, (_, i) => ({
    date: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: 2500000 + Math.floor(Math.random() * 3000000),
    orders: 150 + Math.floor(Math.random() * 120),
  })),
  '1y': Array.from({ length: 12 }, (_, i) => ({
    date: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: 2000000 + Math.floor(Math.random() * 4000000),
    orders: 100 + Math.floor(Math.random() * 150),
  })),
};

export const MOCK_REGION_REVENUE: RegionRevenue[] = [
  { region: 'East', revenue: 6800000, percentage: 36.7, color: '#D71920' },
  { region: 'Center', revenue: 5200000, percentage: 28.1, color: '#2563EB' },
  { region: 'West', revenue: 4100000, percentage: 22.2, color: '#22C55E' },
  { region: 'South', revenue: 2400000, percentage: 13.0, color: '#F59E0B' },
];

export const MOCK_DELEGATES: DelegateRanking[] = [
  { id: '1', name: 'Ahmed Benali', avatar: 'AB', region: 'East', revenue: 2450000, orders: 186, completion: 94, trend: 12.5 },
  { id: '2', name: 'Fatima Zeroual', avatar: 'FZ', region: 'Center', revenue: 2180000, orders: 164, completion: 91, trend: 8.3 },
  { id: '3', name: 'Karim Hadj', avatar: 'KH', region: 'West', revenue: 1920000, orders: 148, completion: 88, trend: 15.2 },
  { id: '4', name: 'Amina Bouzid', avatar: 'AB', region: 'East', revenue: 1750000, orders: 132, completion: 85, trend: 6.7 },
  { id: '5', name: 'Omar Tlemcani', avatar: 'OT', region: 'West', revenue: 1580000, orders: 121, completion: 82, trend: 3.1 },
  { id: '6', name: 'Yasmine Algiers', avatar: 'YA', region: 'Center', revenue: 1420000, orders: 108, completion: 79, trend: 9.8 },
  { id: '7', name: 'Rachid Soummam', avatar: 'RS', region: 'East', revenue: 1280000, orders: 97, completion: 76, trend: 5.4 },
  { id: '8', name: 'Nadia Charef', avatar: 'NC', region: 'South', revenue: 1120000, orders: 85, completion: 73, trend: 11.2 },
];

export const MOCK_SALES_TREND: SalesTrendPoint[] = [
  { month: 'Jul', sales: 3200000, returns: 120000 },
  { month: 'Aug', sales: 3800000, returns: 95000 },
  { month: 'Sep', sales: 4100000, returns: 110000 },
  { month: 'Oct', sales: 3900000, returns: 85000 },
  { month: 'Nov', sales: 4500000, returns: 130000 },
  { month: 'Dec', sales: 4800000, returns: 105000 },
];

export const MOCK_BEST_PRODUCTS: BestProduct[] = [
  { id: '1', name: 'Ooredoo 1000 DA Recharge', revenue: 3200000, quantitySold: 8500, trend: 18.2, category: 'Mobile Credit' },
  { id: '2', name: 'Djezzy SIM Starter Pack', revenue: 2800000, quantitySold: 4200, trend: 12.5, category: 'SIM Card' },
  { id: '3', name: 'Mobilis 500 DA Recharge', revenue: 2100000, quantitySold: 7200, trend: 8.7, category: 'Mobile Credit' },
  { id: '4', name: 'Huawei Y6 Pro 2024', revenue: 1950000, quantitySold: 340, trend: 22.1, category: 'Device' },
  { id: '5', name: 'Samsung Galaxy A15', revenue: 1800000, quantitySold: 290, trend: 15.3, category: 'Device' },
  { id: '6', name: 'Ooredoo 2000 DA Recharge', revenue: 1650000, quantitySold: 3800, trend: 9.4, category: 'Mobile Credit' },
  { id: '7', name: 'Orange SIM Starter Pack', revenue: 1420000, quantitySold: 3100, trend: 6.8, category: 'SIM Card' },
  { id: '8', name: 'Djezzy 1500 DA Recharge', revenue: 1280000, quantitySold: 4100, trend: 11.2, category: 'Mobile Credit' },
];

export const MOCK_ORDERS_BY_STATUS: OrdersByStatus[] = [
  { name: 'Pending', value: 342, color: '#F59E0B' },
  { name: 'Validated', value: 528, color: '#2563EB' },
  { name: 'Preparing', value: 186, color: '#8B5CF6' },
  { name: 'Delivered', value: 2845, color: '#22C55E' },
  { name: 'Cancelled', value: 384, color: '#EF4444' },
];

export const MOCK_REPORT_TEMPLATES: ReportTemplate[] = [
  { id: '1', title: 'Daily Sales', description: 'Complete daily sales overview with comparisons', icon: 'Calendar', category: 'sales' },
  { id: '2', title: 'Weekly Revenue', description: 'Revenue breakdown by week with trends', icon: 'TrendingUp', category: 'revenue' },
  { id: '3', title: 'Monthly Financial', description: 'Full financial statement for the month', icon: 'DollarSign', category: 'financial' },
  { id: '4', title: 'Delegate Performance', description: 'Individual and team performance metrics', icon: 'Users', category: 'delegate' },
  { id: '5', title: 'Warehouse Activity', description: 'Warehouse operations and utilization', icon: 'Warehouse', category: 'warehouse' },
  { id: '6', title: 'Stock Report', description: 'Inventory levels, movements, and alerts', icon: 'Package', category: 'stock' },
  { id: '7', title: 'Client Activity', description: 'Client engagement and order patterns', icon: 'UserCheck', category: 'client' },
  { id: '8', title: 'Regional Revenue', description: 'Revenue analysis by region and wilaya', icon: 'MapPin', category: 'regional' },
];

export const MOCK_SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: '1', title: 'Daily Sales Summary', schedule: 'Daily at 18:00', status: 'active' },
  { id: '2', title: 'Weekly Revenue Report', schedule: 'Every Monday 09:00', status: 'active' },
  { id: '3', title: 'Monthly Financial Statement', schedule: '1st Day of Month', status: 'active' },
  { id: '4', title: 'Quarterly Business Review', schedule: 'Every 3 Months', status: 'paused' },
];

export const MOCK_RECENT_REPORTS: RecentReport[] = [
  { id: '1', name: 'Daily Sales Summary - Jul 30', createdBy: 'System', createdDate: '2025-07-30T18:00:00', category: 'sales', format: 'pdf', status: 'ready' },
  { id: '2', name: 'Weekly Revenue - W29 2025', createdBy: 'Ahmed Benali', createdDate: '2025-07-28T09:00:00', category: 'revenue', format: 'excel', status: 'ready' },
  { id: '3', name: 'Delegate Performance - July', createdBy: 'System', createdDate: '2025-07-27T14:30:00', category: 'delegate', format: 'pdf', status: 'processing' },
  { id: '4', name: 'Stock Alert Report', createdBy: 'Fatima Zeroual', createdDate: '2025-07-26T11:15:00', category: 'stock', format: 'csv', status: 'ready' },
  { id: '5', name: 'Monthly Financial - June', createdBy: 'System', createdDate: '2025-07-01T08:00:00', category: 'financial', format: 'pdf', status: 'ready' },
  { id: '6', name: 'Regional Revenue Analysis', createdBy: 'Omar Tlemcani', createdDate: '2025-07-25T16:45:00', category: 'regional', format: 'excel', status: 'ready' },
  { id: '7', name: 'Warehouse Utilization Report', createdBy: 'System', createdDate: '2025-07-24T20:00:00', category: 'warehouse', format: 'pdf', status: 'failed' },
  { id: '8', name: 'Client Activity - July', createdBy: 'Amina Bouzid', createdDate: '2025-07-23T13:20:00', category: 'client', format: 'pdf', status: 'scheduled' },
  { id: '9', name: 'Daily Sales Summary - Jul 29', createdBy: 'System', createdDate: '2025-07-29T18:00:00', category: 'sales', format: 'pdf', status: 'ready' },
  { id: '10', name: 'Weekly Revenue - W28 2025', createdBy: 'Karim Hadj', createdDate: '2025-07-21T09:00:00', category: 'revenue', format: 'excel', status: 'ready' },
];

export const MOCK_SYSTEM_HEALTH = [
  { name: 'API Server', status: 'operational' as const, latency: 18 },
  { name: 'Database', status: 'operational' as const, latency: 12 },
  { name: 'Redis', status: 'operational' as const, latency: 3 },
  { name: 'Socket.IO', status: 'operational' as const, latency: 8 },
  { name: 'Background Jobs', status: 'operational' as const, latency: 24 },
  { name: 'Storage', status: 'operational' as const, latency: 15 },
];

export const MOCK_CONNECTED_USERS = 42;
