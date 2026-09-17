import type { ExtendedClient, ClientFilters } from '../types';

export function filterClients(clients: ExtendedClient[], filters: ClientFilters): ExtendedClient[] {
  return clients.filter((client) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        client.name.toLowerCase().includes(q) ||
        client.clientCode.toLowerCase().includes(q) ||
        client.phone.includes(q) ||
        client.email?.toLowerCase().includes(q) ||
        client.region.toLowerCase().includes(q) ||
        client.wilaya.toLowerCase().includes(q) ||
        client.delegateName?.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(client.status)) return false;
    if (filters.region.length > 0 && !filters.region.includes(client.region)) return false;
    if (filters.delegate.length > 0 && !filters.delegate.includes(client.delegateName || '')) return false;
    if (filters.clientType.length > 0 && !filters.clientType.includes(client.clientType)) return false;

    if (filters.dateRange.start) {
      const clientDate = new Date(client.createdAt);
      if (clientDate < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      const clientDate = new Date(client.createdAt);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (clientDate > end) return false;
    }

    return true;
  });
}

export function sortClients(
  clients: ExtendedClient[],
  field: string,
  direction: 'asc' | 'desc'
): ExtendedClient[] {
  return [...clients].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'clientCode':
        comparison = a.clientCode.localeCompare(b.clientCode);
        break;
      case 'phone':
        comparison = a.phone.localeCompare(b.phone);
        break;
      case 'region':
        comparison = a.region.localeCompare(b.region);
        break;
      case 'delegateName':
        comparison = (a.delegateName || '').localeCompare(b.delegateName || '');
        break;
      case 'totalOrders':
        comparison = a.totalOrders - b.totalOrders;
        break;
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
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
  });
}
