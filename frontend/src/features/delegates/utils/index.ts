import type { Delegate } from '@/types';
import type { DelegateFilters } from '../types';

export function filterDelegates(delegates: Delegate[], filters: DelegateFilters): Delegate[] {
  return delegates.filter((delegate) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        delegate.name.toLowerCase().includes(q) ||
        delegate.email.toLowerCase().includes(q) ||
        delegate.phone.includes(q) ||
        delegate.region.toLowerCase().includes(q) ||
        delegate.wilaya.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(delegate.status as any)) return false;
    if (filters.region.length > 0 && !filters.region.includes(delegate.region)) return false;
    if (filters.wilaya.length > 0 && !filters.wilaya.includes(delegate.wilaya)) return false;

    if (filters.performance !== 'all') {
      const rate = delegate.completionRate;
      if (filters.performance === 'excellent' && rate < 90) return false;
      if (filters.performance === 'good' && (rate < 80 || rate >= 90)) return false;
      if (filters.performance === 'average' && (rate < 70 || rate >= 80)) return false;
      if (filters.performance === 'poor' && rate >= 70) return false;
    }

    if (filters.dateRange.start) {
      const delegateDate = new Date(delegate.createdAt);
      if (delegateDate < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      const delegateDate = new Date(delegate.createdAt);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (delegateDate > end) return false;
    }

    return true;
  });
}

export function sortDelegates(
  delegates: Delegate[],
  field: string,
  direction: 'asc' | 'desc'
): Delegate[] {
  return [...delegates].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'phone':
        comparison = a.phone.localeCompare(b.phone);
        break;
      case 'region':
        comparison = a.region.localeCompare(b.region);
        break;
      case 'wilaya':
        comparison = a.wilaya.localeCompare(b.wilaya);
        break;
      case 'totalOrders':
        comparison = a.totalOrders - b.totalOrders;
        break;
      case 'totalRevenue':
        comparison = a.totalRevenue - b.totalRevenue;
        break;
      case 'completionRate':
        comparison = a.completionRate - b.completionRate;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'lastActivity':
        comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
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
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
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

export function getPerformanceLevel(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: 'Excellent', color: '#22C55E' };
  if (rate >= 80) return { label: 'Good', color: '#2563EB' };
  if (rate >= 70) return { label: 'Average', color: '#F59E0B' };
  return { label: 'Poor', color: '#EF4444' };
}
