export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DELEGATE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  delegateId: string;
  delegateName: string;
  region: string;
  wilaya: string;
  products: OrderProduct[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'validated' | 'preparing' | 'delivered' | 'rejected' | 'cancelled';

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  region: string;
  wilaya: string;
  delegateId?: string;
  delegateName?: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  createdAt: string;
}

export interface Delegate {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  wilaya: string;
  totalOrders: number;
  totalRevenue: number;
  completionRate: number;
  status: 'online' | 'busy' | 'offline' | 'suspended';
  lastActivity: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minStock: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type ProductCategory = 'sim_cards' | 'mobile_credit' | 'accessories' | 'bundles' | 'data_packs';

export interface Region {
  id: string;
  name: string;
  code: string;
  delegateCount: number;
  clientCount: number;
  orderCount: number;
  revenue: number;
}

export interface Wilaya {
  id: string;
  name: string;
  code: string;
  regionId: string;
  regionName: string;
  delegateCount: number;
  clientCount: number;
  orderCount: number;
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  warehouse: string;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'system' | 'delegate';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardKPI {
  ordersToday: number;
  ordersTrend: number;
  revenueToday: number;
  revenueTrend: number;
  pendingOrders: number;
  pendingTrend: number;
  activeDelegates: number;
  connectedDelegates: number;
}

export interface SystemStatus {
  api: StatusItem;
  database: StatusItem;
  redis: StatusItem;
  storage: StatusItem;
  socketIO: StatusItem;
  backgroundJobs: StatusItem;
  cpu: number;
  ram: number;
}

export interface StatusItem {
  status: 'online' | 'offline';
  latency?: number;
}
