import type { ExtendedOrder, OrderItem } from './types';

const CLIENTS = [
  { id: 'c1', name: 'Telecom Plus DZ', region: 'Algiers', wilaya: 'Alger' },
  { id: 'c2', name: 'Mobilis Store Algiers', region: 'Algiers', wilaya: 'Alger' },
  { id: 'c3', name: 'Optimum Telecom', region: 'Oran', wilaya: 'Oran' },
  { id: 'c4', name: 'Djezzy Distribution', region: 'Constantine', wilaya: 'Constantine' },
  { id: 'c5', name: 'Ooredoo Partner', region: 'Annaba', wilaya: 'Annaba' },
  { id: 'c6', name: 'Algérie Télécom', region: 'Batna', wilaya: 'Batna' },
  { id: 'c7', name: 'Batna Mobile Center', region: 'Batna', wilaya: 'Batna' },
  { id: 'c8', name: 'Oran Digital Shop', region: 'Oran', wilaya: 'Oran' },
  { id: 'c9', name: 'Constantine Connect', region: 'Constantine', wilaya: 'Constantine' },
  { id: 'c10', name: 'Sétif Wireless', region: 'Sétif', wilaya: 'Sétif' },
  { id: 'c11', name: 'Tlemcen Tech', region: 'Tlemcen', wilaya: 'Tlemcen' },
  { id: 'c12', name: 'Annaba Mobile', region: 'Annaba', wilaya: 'Annaba' },
  { id: 'c13', name: 'Biskra Telecom', region: 'Biskra', wilaya: 'Biskra' },
  { id: 'c14', name: 'Blida Digital', region: 'Blida', wilaya: 'Blida' },
  { id: 'c15', name: 'Tizi Ouzou Connect', region: 'Tizi Ouzou', wilaya: "Tizi Ouzou" },
];

const DELEGATES = [
  { id: 'd1', name: 'Yacine B.' },
  { id: 'd2', name: 'Amine K.' },
  { id: 'd3', name: 'Sofiane M.' },
  { id: 'd4', name: 'Rachid T.' },
  { id: 'd5', name: 'Karim A.' },
  { id: 'd6', name: 'Mohamed S.' },
  { id: 'd7', name: 'Omar F.' },
  { id: 'd8', name: 'Ali B.' },
  { id: 'd9', name: 'Youcef H.' },
  { id: 'd10', name: 'Abdelkader D.' },
];

const PRODUCT_NAMES = [
  { name: 'Mobilis SIM Card', sku: 'SIM-MOB-001', price: 500 },
  { name: 'Djezzy SIM Card', sku: 'SIM-DJE-001', price: 500 },
  { name: 'Ooredoo SIM Card', sku: 'SIM-OOR-001', price: 500 },
  { name: '1000 DA Credit', sku: 'CRD-1000', price: 1000 },
  { name: '2000 DA Credit', sku: 'CRD-2000', price: 2000 },
  { name: '5000 DA Credit', sku: 'CRD-5000', price: 5000 },
  { name: 'Phone Case', sku: 'ACC-CASE-01', price: 1500 },
  { name: 'Screen Protector', sku: 'ACC-SCRP-01', price: 800 },
  { name: 'Charger Cable', sku: 'ACC-CHRG-01', price: 1200 },
  { name: 'Power Bank 10000mAh', sku: 'ACC-PWRB-01', price: 3500 },
  { name: 'Data Pack 5GB', sku: 'DATA-5GB', price: 1500 },
  { name: 'Data Pack 10GB', sku: 'DATA-10GB', price: 2500 },
];

const STATUSES: ExtendedOrder['status'][] = ['pending', 'validated', 'preparing', 'delivered', 'rejected', 'cancelled'];
const PAYMENT_METHODS: ExtendedOrder['paymentMethod'][] = ['cash', 'credit', 'transfer'];
const PRIORITIES: ExtendedOrder['priority'][] = ['low', 'normal', 'high', 'urgent'];

function generateOrderItems(orderIndex: number, count: number): OrderItem[] {
  return Array.from({ length: count }, (_, i) => {
    const product = PRODUCT_NAMES[(orderIndex + i) % PRODUCT_NAMES.length];
    const qty = ((orderIndex * 3 + i * 7) % 10) + 1;
    return {
      id: `item-${orderIndex}-${i}`,
      productName: product.name,
      sku: product.sku,
      quantity: qty,
      unitPrice: product.price,
      total: qty * product.price,
    };
  });
}

export function generateExtendedOrders(count: number): ExtendedOrder[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const client = CLIENTS[i % CLIENTS.length];
    const delegate = DELEGATES[i % DELEGATES.length];
    const items = generateOrderItems(i, (i % 4) + 1);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const daysAgo = i % 7;
    const hoursAgo = i % 24;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);

    return {
      id: `ord-${2026}-${i + 1}`,
      orderNumber: `ORD-2026-${String(892 - i).padStart(4, '0')}`,
      clientId: client.id,
      clientName: client.name,
      delegateId: delegate.id,
      delegateName: delegate.name,
      region: client.region,
      wilaya: client.wilaya,
      products: items.map((item) => ({
        productId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      totalAmount: total,
      status: STATUSES[i % STATUSES.length],
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      priority: PRIORITIES[i % PRIORITIES.length],
      deliveryAddress: `${(i % 50) + 1} Rue ${(i % 20) + 1}, ${client.wilaya}`,
      notes: i % 5 === 0 ? 'Urgent delivery requested' : undefined,
      items,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    };
  });
}

export const mockOrders = generateExtendedOrders(50);
