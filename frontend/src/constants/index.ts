import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserPlus,
  Package,
  Globe,
  MapPin,
  BarChart3,
  FileText,
  Bell,
  Send,
  Settings,
  HardDrive,
  Truck,
  ShoppingBag,
  Banknote,
  FileSpreadsheet,
  MessageSquare,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  permission?: string;
  adminOnly?: boolean;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: number;
  permission?: string;
  adminOnly?: boolean;
  children?: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Vente',
    icon: ShoppingBag,
    permission: 'orders.view',
    children: [
      { label: 'Commandes', href: '/orders', icon: ShoppingCart, permission: 'orders.view' },
      { label: 'Bons de Livraison', href: '/delivery-notes', icon: Truck, permission: 'orders.view' },
      { label: 'Journal de Vente', href: '/sales-journal', icon: FileSpreadsheet, permission: 'orders.view' },
    ],
  },
  { label: 'Clients', href: '/clients', icon: Users, permission: 'clients.view' },
  { label: 'Encaissements', href: '/encaissements', icon: Banknote, permission: 'clients.view' },
  { label: 'Délégués', href: '/delegates', icon: UserPlus, permission: 'users.manage' },
  { label: 'Objectifs & Missions', href: '/objectives', icon: Target },
  { label: 'Produits', href: '/products', icon: Package, permission: 'products.view' },
  { label: 'Régions', href: '/regions', icon: Globe, permission: 'settings.manage' },
  { label: 'Wilayas', href: '/wilayas', icon: MapPin, permission: 'settings.manage' },
  { label: 'Stock', href: '/stock', icon: HardDrive, permission: 'products.manage' },
  { label: 'Rapports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
  { label: 'Utilisateurs', href: '/users', icon: FileText, permission: 'users.manage' },
  { label: 'Messagerie', href: '/chat', icon: MessageSquare },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Diffusions Push', href: '/push-notifications', icon: Send, permission: 'settings.manage' },
  { label: 'Paramètres', href: '/settings', icon: Settings, permission: 'settings.manage' },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [];

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'validated', label: 'Validated', color: '#22C55E' },
  { value: 'preparing', label: 'Preparing', color: '#2563EB' },
  { value: 'delivered', label: 'Delivered', color: '#8B5CF6' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444' },
  { value: 'cancelled', label: 'Cancelled', color: '#6B7280' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'sim_cards', label: 'SIM Cards' },
  { value: 'mobile_credit', label: 'Mobile Credit' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'data_packs', label: 'Data Packs' },
] as const;

export const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DELEGATE', label: 'Delegate' },
] as const;

export const COLORS = {
  primary: '#D71920',
  primaryHover: '#B81419',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#2563EB',
  indigo: '#6366F1',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  cyan: '#06B6D4',
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;
