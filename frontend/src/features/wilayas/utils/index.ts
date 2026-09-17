import type { WilayaRow, WilayasFilters, WilayaPerformance, WilayaStatus, RegionId } from '../types';

export function filterWilayas(wilayas: WilayaRow[], filters: WilayasFilters): WilayaRow[] {
  return wilayas.filter((w) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.code.includes(q) ||
        w.delegate?.name.toLowerCase().includes(q) ||
        w.regionName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.region.length > 0 && !filters.region.includes(w.regionId)) return false;
    if (filters.delegate.length > 0 && (!w.delegate || !filters.delegate.includes(w.delegate.name))) return false;
    if (filters.status.length > 0 && !filters.status.includes(w.status)) return false;
    if (filters.revenueRange !== 'all') {
      if (filters.revenueRange === 'over_10m' && w.monthlyRevenue < 10000000) return false;
      if (filters.revenueRange === '5m_10m' && (w.monthlyRevenue < 5000000 || w.monthlyRevenue >= 10000000)) return false;
      if (filters.revenueRange === 'under_5m' && w.monthlyRevenue >= 5000000) return false;
    }
    if (filters.growth !== 'all') {
      if (filters.growth === 'positive' && w.growth <= 0) return false;
      if (filters.growth === 'negative' && w.growth >= 0) return false;
      if (filters.growth === 'high' && w.growth < 15) return false;
    }
    return true;
  });
}

export function sortWilayas(
  wilayas: WilayaRow[],
  field: string,
  direction: 'asc' | 'desc'
): WilayaRow[] {
  return [...wilayas].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'rank': comparison = a.rank - b.rank; break;
      case 'name': comparison = a.name.localeCompare(b.name); break;
      case 'region': comparison = a.regionName.localeCompare(b.regionName); break;
      case 'clients': comparison = a.clients - b.clients; break;
      case 'orders': comparison = a.ordersMonth - b.ordersMonth; break;
      case 'monthlyRevenue': comparison = a.monthlyRevenue - b.monthlyRevenue; break;
      case 'yearlyRevenue': comparison = a.yearlyRevenue - b.yearlyRevenue; break;
      case 'avgOrder': comparison = a.avgOrder - b.avgOrder; break;
      case 'growth': comparison = a.growth - b.growth; break;
      case 'performance': comparison = a.performanceScore - b.performanceScore; break;
      case 'status': comparison = a.status.localeCompare(b.status); break;
      default: comparison = 0;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatCompactCurrency(amount: number): string {
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

export function getPerformanceColor(perf: WilayaPerformance): string {
  switch (perf) {
    case 'excellent': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'good': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'average': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'needs_attention': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  }
}

export function getPerformanceLabel(perf: WilayaPerformance): string {
  switch (perf) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'average': return 'Average';
    case 'needs_attention': return 'Needs Attention';
  }
}

export function getStatusColor(status: WilayaStatus): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'limited': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'inactive': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
  }
}

export function getStatusDot(status: WilayaStatus): string {
  switch (status) {
    case 'active': return 'bg-emerald-500';
    case 'limited': return 'bg-amber-500';
    case 'inactive': return 'bg-slate-400';
  }
}

export function getStatusLabel(status: WilayaStatus): string {
  switch (status) {
    case 'active': return 'Active';
    case 'limited': return 'Limited';
    case 'inactive': return 'Inactive';
  }
}

export function getRegionColor(regionId: RegionId): string {
  switch (regionId) {
    case 'east': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'center': return 'bg-primary/10 text-primary';
    case 'west': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'south': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
}

export function getGrowthColor(growth: number): string {
  if (growth >= 15) return 'text-emerald-600 dark:text-emerald-400';
  if (growth >= 5) return 'text-blue-600 dark:text-blue-400';
  if (growth >= 0) return 'text-muted-foreground';
  return 'text-rose-600 dark:text-rose-400';
}
