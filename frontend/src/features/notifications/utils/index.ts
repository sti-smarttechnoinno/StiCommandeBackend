import type { NotificationCategory, NotificationPriority, NotificationStatus } from '../types';

export function getCategoryColor(category: NotificationCategory): string {
  const colors: Record<NotificationCategory, string> = {
    orders: 'bg-blue-500/10 text-blue-600',
    stock: 'bg-emerald-500/10 text-emerald-600',
    delegates: 'bg-cyan-500/10 text-cyan-600',
    clients: 'bg-purple-500/10 text-purple-600',
    reports: 'bg-indigo-500/10 text-indigo-600',
    security: 'bg-rose-500/10 text-rose-600',
    system: 'bg-muted text-muted-foreground',
    finance: 'bg-emerald-500/10 text-emerald-600',
  };
  return colors[category];
}

export function getCategoryIcon(category: NotificationCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    critical: 'bg-rose-500/10 text-rose-600 border-rose-200',
    high: 'bg-orange-500/10 text-orange-600 border-orange-200',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  };
  return colors[priority];
}

export function getPriorityBorder(priority: NotificationPriority): string {
  const borders: Record<NotificationPriority, string> = {
    critical: 'border-l-rose-500',
    high: 'border-l-orange-500',
    medium: 'border-l-amber-500',
    low: 'border-l-emerald-500',
  };
  return borders[priority];
}

export function getStatusColor(status: NotificationStatus): string {
  const colors: Record<NotificationStatus, string> = {
    unread: 'bg-amber-500/10 text-amber-600',
    read: 'bg-emerald-500/10 text-emerald-600',
    resolved: 'bg-blue-500/10 text-blue-600',
    archived: 'bg-muted text-muted-foreground',
  };
  return colors[status];
}

export function getStatusDot(status: NotificationStatus): string {
  const dots: Record<NotificationStatus, string> = {
    unread: 'bg-amber-500',
    read: 'bg-emerald-500',
    resolved: 'bg-blue-500',
    archived: 'bg-muted-foreground',
  };
  return dots[status];
}

export function getStatusLabel(status: NotificationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
