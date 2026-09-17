import type { DateRange } from '../types';

export function formatRevenue(value: number): string {
  return `${new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(value)} DA`;
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(value)} DA`;
}

export function formatCompactCurrency(value: number): string {
  return `${new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(value)} DA`;
}

export function getDateRangeLabel(range: DateRange): string {
  const labels: Record<DateRange, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '1y': 'Last Year',
  };
  return labels[range];
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ready: 'bg-emerald-500/10 text-emerald-600',
    processing: 'bg-blue-500/10 text-blue-600',
    failed: 'bg-rose-500/10 text-rose-600',
    scheduled: 'bg-amber-500/10 text-amber-600',
    active: 'bg-emerald-500/10 text-emerald-600',
    paused: 'bg-muted text-muted-foreground',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export function getStatusDot(status: string): string {
  const dots: Record<string, string> = {
    ready: 'bg-emerald-500',
    processing: 'bg-blue-500',
    failed: 'bg-rose-500',
    scheduled: 'bg-amber-500',
    active: 'bg-emerald-500',
    paused: 'bg-muted-foreground',
  };
  return dots[status] || 'bg-muted-foreground';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    sales: 'bg-emerald-500/10 text-emerald-600',
    revenue: 'bg-blue-500/10 text-blue-600',
    delegate: 'bg-indigo-500/10 text-indigo-600',
    warehouse: 'bg-amber-500/10 text-amber-600',
    stock: 'bg-rose-500/10 text-rose-600',
    client: 'bg-purple-500/10 text-purple-600',
    regional: 'bg-teal-500/10 text-teal-600',
    financial: 'bg-orange-500/10 text-orange-600',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    sales: 'Sales',
    revenue: 'Revenue',
    delegate: 'Delegate',
    warehouse: 'Warehouse',
    stock: 'Stock',
    client: 'Client',
    regional: 'Regional',
    financial: 'Financial',
  };
  return labels[category] || category;
}

export function getFormatIcon(format: string): string {
  const icons: Record<string, string> = {
    pdf: 'FileText',
    excel: 'Sheet',
    csv: 'FileSpreadsheet',
    print: 'Printer',
  };
  return icons[format] || 'File';
}

export function getGrowthColor(value: number): string {
  return value >= 0 ? 'text-emerald-600' : 'text-rose-600';
}

export function getGrowthBg(value: number): string {
  return value >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10';
}
