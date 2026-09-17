import type { ExtendedOrder, OrderFilters } from '../types';

export function filterOrders(orders: ExtendedOrder[], filters: OrderFilters): ExtendedOrder[] {
  return orders.filter((order) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        order.orderNumber.toLowerCase().includes(q) ||
        order.clientName.toLowerCase().includes(q) ||
        order.delegateName.toLowerCase().includes(q) ||
        order.region.toLowerCase().includes(q) ||
        order.wilaya.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(order.status)) return false;
    if (filters.region.length > 0 && !filters.region.includes(order.region)) return false;
    if (filters.delegate.length > 0 && !filters.delegate.includes(order.delegateName)) return false;
    if (filters.client.length > 0 && !filters.client.includes(order.clientName)) return false;
    if (filters.paymentMethod.length > 0 && !filters.paymentMethod.includes(order.paymentMethod)) return false;

    if (filters.minAmount !== null && order.totalAmount < filters.minAmount) return false;
    if (filters.maxAmount !== null && order.totalAmount > filters.maxAmount) return false;

    if (filters.dateRange.start) {
      const orderDate = new Date(order.createdAt);
      if (orderDate < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }

    return true;
  });
}

export function sortOrders(
  orders: ExtendedOrder[],
  field: string,
  direction: 'asc' | 'desc'
): ExtendedOrder[] {
  return [...orders].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'orderNumber':
        comparison = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case 'clientName':
        comparison = a.clientName.localeCompare(b.clientName);
        break;
      case 'delegateName':
        comparison = a.delegateName.localeCompare(b.delegateName);
        break;
      case 'totalAmount':
        comparison = a.totalAmount - b.totalAmount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'region':
        comparison = a.region.localeCompare(b.region);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' DA';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
