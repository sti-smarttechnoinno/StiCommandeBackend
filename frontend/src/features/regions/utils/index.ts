import type { RegionData, Wilaya, RegionsFilters, WilayaStatus } from '../types';

export function filterWilayas(wilayas: Wilaya[], filters: RegionsFilters): Wilaya[] {
  return wilayas.filter((w) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.code.includes(q) ||
        w.delegate?.name.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.delegate.length > 0 && (!w.delegate || !filters.delegate.includes(w.delegate.name))) return false;
    if (filters.status.length > 0 && !filters.status.includes(w.status)) return false;
    return true;
  });
}

export function filterRegions(regions: RegionData[], filters: RegionsFilters): RegionData[] {
  return regions
    .map((region) => {
      if (filters.region.length > 0 && !filters.region.includes(region.id)) return null;
      const filteredWilayas = filterWilayas(region.wilayas, filters);
      if (filters.region.length === 0 && filteredWilayas.length === 0 && filters.search) return null;
      return { ...region, wilayas: filteredWilayas };
    })
    .filter(Boolean) as RegionData[];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function getStatusColor(status: WilayaStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'limited':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'inactive':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
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

export function getTotalStats(regions: RegionData[]) {
  return regions.reduce(
    (acc, r) => ({
      regions: acc.regions + 1,
      wilayas: acc.wilayas + r.wilayas.length,
      delegates: acc.delegates + r.delegates,
      clients: acc.clients + r.clients,
      ordersToday: acc.ordersToday + r.ordersToday,
      revenue: acc.revenue + r.revenue,
    }),
    { regions: 0, wilayas: 0, delegates: 0, clients: 0, ordersToday: 0, revenue: 0 }
  );
}
