import type { Order, Client, Delegate, Product, DashboardKPI, SystemStatus, Notification, StockItem } from '@/types';

const CLIENTS = [
  'Telecom Plus DZ', 'Mobilis Store Algiers', 'Optimum Telecom', 'Djezzy Distribution',
  'Ooredoo Partner', 'Algérie Télécom', 'Batna Mobile Center', 'Oran Digital Shop',
  'Constantine Connect', 'Sétif Wireless', 'Tlemcen Tech', 'Annaba Mobile',
  'Biskra Telecom', 'Blida Digital', 'Tizi Ouzou Connect',
];

const DELEGATES = [
  'Yacine B.', 'Amine K.', 'Sofiane M.', 'Rachid T.', 'Karim A.',
  'Mohamed S.', 'Omar F.', 'Ali B.', 'Youcef H.', 'Abdelkader D.',
];

const REGIONS = [
  'Algiers', 'Oran', 'Constantine', 'Annaba', 'Batna',
  'Sétif', 'Blida', 'Tizi Ouzou', 'Biskra', 'Tlemcen',
];

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Batna',
  'Sétif', 'Blida', 'Tizi Ouzou', 'Biskra', 'Tlemcen',
  'Béjaïa', 'Chlef', 'Djelfa', 'M\'sila', 'Mascara',
];

const PRODUCTS = [
  'Mobilis SIM Card', 'Djezzy SIM Card', 'Ooredoo SIM Card', '1000 DA Credit',
  '2000 DA Credit', '5000 DA Credit', 'Phone Case', 'Screen Protector',
  'Charger Cable', 'Power Bank', 'Data Pack 5GB', 'Data Pack 10GB',
];

const STATUSES: Order['status'][] = ['pending', 'validated', 'preparing', 'delivered', 'rejected', 'cancelled'];

export function generateOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => {
    const clientIdx = i % CLIENTS.length;
    const delegateIdx = i % DELEGATES.length;
    const regionIdx = i % REGIONS.length;
    const wilayaIdx = i % WILAYAS.length;
    const statusIdx = i % STATUSES.length;
    const productIdx = i % PRODUCTS.length;
    const amount = 55000 + ((i * 37) % 40) * 10000;

    return {
      id: `ord-2026-${i + 1}`,
      orderNumber: `ORD-2026-${String(892 - i).padStart(4, '0')}`,
      clientId: `client-${clientIdx + 1}`,
      clientName: CLIENTS[clientIdx],
      delegateId: `delegate-${delegateIdx + 1}`,
      delegateName: DELEGATES[delegateIdx],
      region: REGIONS[regionIdx],
      wilaya: WILAYAS[wilayaIdx],
      products: [
        {
          productId: `prod-${productIdx + 1}`,
          productName: PRODUCTS[productIdx],
          quantity: (i % 5) + 1,
          unitPrice: 2500,
          total: ((i % 5) + 1) * 2500,
        },
      ],
      totalAmount: amount,
      status: STATUSES[statusIdx],
      createdAt: '2026-07-28T10:00:00.000Z',
      updatedAt: '2026-07-28T12:00:00.000Z',
    };
  });
}

export function generateClients(count: number): Client[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `client-${i + 1}`,
    name: CLIENTS[i % CLIENTS.length],
    email: `contact@${CLIENTS[i % CLIENTS.length].toLowerCase().replace(/\s+/g, '')}.dz`,
    phone: `0550${String(100000 + i * 11111).slice(-6)}`,
    address: `${(i % 50) + 1} Rue ${(i % 20) + 1}, ${WILAYAS[i % WILAYAS.length]}`,
    region: REGIONS[i % REGIONS.length],
    wilaya: WILAYAS[i % WILAYAS.length],
    delegateId: `delegate-${(i % DELEGATES.length) + 1}`,
    delegateName: DELEGATES[i % DELEGATES.length],
    totalOrders: 15 + i * 3,
    totalSpent: 150000 + i * 45000,
    status: i % 5 === 0 ? 'inactive' : 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
  }));
}

export function generateDelegates(count: number): Delegate[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `delegate-${i + 1}`,
    name: DELEGATES[i % DELEGATES.length],
    email: `${DELEGATES[i % DELEGATES.length].toLowerCase().replace(/\s+/g, '.')}@sti.dz`,
    phone: `0770${String(100000 + i * 22222).slice(-6)}`,
    region: REGIONS[i % REGIONS.length],
    wilaya: WILAYAS[i % WILAYAS.length],
    totalOrders: 30 + i * 4,
    totalRevenue: 800000 + i * 120000,
    completionRate: 85 + (i % 14),
    status: (['online', 'busy', 'offline'] as const)[i % 3],
    lastActivity: '2026-07-28T14:30:00.000Z',
    createdAt: '2026-01-10T09:00:00.000Z',
  }));
}

export function generateProducts(count: number): Product[] {
  return [];
}

export function getDashboardKPI(): DashboardKPI {
  return {
    ordersToday: 145,
    ordersTrend: 18,
    revenueToday: 3250000,
    revenueTrend: 24,
    pendingOrders: 24,
    pendingTrend: -6,
    activeDelegates: 38,
    connectedDelegates: 32,
  };
}

export function getSystemStatus(): SystemStatus {
  return {
    api: { status: 'online', latency: 12 },
    database: { status: 'online', latency: 8 },
    redis: { status: 'online', latency: 2 },
    storage: { status: 'online', latency: 45 },
    socketIO: { status: 'online' },
    backgroundJobs: { status: 'online' },
    cpu: 34,
    ram: 62,
  };
}

export function getNotifications(): Notification[] {
  return [
    { id: '1', type: 'order', title: 'New order received', message: 'Order #ORD-2026-0892 from Algiers', read: false, createdAt: '2026-07-28T14:58:00.000Z' },
    { id: '2', type: 'order', title: 'Order validated', message: 'Order #ORD-2026-0890 has been validated', read: false, createdAt: '2026-07-28T14:45:00.000Z' },
    { id: '3', type: 'stock', title: 'Low stock alert', message: 'SIM Cards below threshold', read: false, createdAt: '2026-07-28T14:00:00.000Z' },
    { id: '4', type: 'delegate', title: 'Delegate milestone', message: 'Yacine B. completed 15 orders today', read: true, createdAt: '2026-07-28T12:00:00.000Z' },
    { id: '5', type: 'system', title: 'System backup', message: 'Backup completed successfully', read: true, createdAt: '2026-07-28T09:00:00.000Z' },
  ];
}

export function getStockItems(): StockItem[] {
  return [];
}

export const CHART_COLORS = {
  revenue: '#D71920',
  orders: '#2563EB',
  pending: '#F59E0B',
  validated: '#22C55E',
  preparing: '#2563EB',
  delivered: '#8B5CF6',
  rejected: '#EF4444',
  cancelled: '#6B7280',
} as const;
