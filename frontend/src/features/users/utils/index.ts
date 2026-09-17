import type { UserRole, UserStatus } from '../types';

export function getRoleColor(role: UserRole | string): string {
  const r = (role || '').toLowerCase();
  const colors: Record<string, string> = {
    administrator: 'bg-rose-500/10 text-rose-600',
    admin: 'bg-rose-500/10 text-rose-600',
    manager: 'bg-purple-500/10 text-purple-600',
    charge_compte: 'bg-purple-500/10 text-purple-600',
    delegate: 'bg-blue-500/10 text-blue-600',
    commercial: 'bg-blue-500/10 text-blue-600',
    warehouse: 'bg-amber-500/10 text-amber-600',
    viewer: 'bg-muted text-muted-foreground',
  };
  return colors[r] || 'bg-primary/10 text-primary';
}

export function getRoleLabel(role: UserRole | string): string {
  const r = (role || '').toLowerCase();
  const labels: Record<string, string> = {
    administrator: 'Administrateur',
    admin: 'Administrateur',
    manager: 'Manager',
    charge_compte: 'Chargé de Compte',
    delegate: 'Commercial / Délégué',
    commercial: 'Commercial',
    warehouse: 'Magasinier',
    viewer: 'Lecteur',
  };
  if (labels[r]) return labels[r];
  return role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : '';
}

export function getStatusColor(status: UserStatus): string {
  const s = (status || '').toLowerCase();
  if (s === 'blocked' || s === 'locked' || s === 'suspended' || s === 'bloque' || s === 'bloqué') {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
  }
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
}

export function getStatusDot(status: UserStatus): string {
  const s = (status || '').toLowerCase();
  if (s === 'blocked' || s === 'locked' || s === 'suspended' || s === 'bloque' || s === 'bloqué') {
    return 'bg-rose-500';
  }
  return 'bg-emerald-500';
}

export function getStatusLabel(status: UserStatus): string {
  const s = (status || '').toLowerCase();
  if (s === 'blocked' || s === 'locked' || s === 'suspended' || s === 'bloque' || s === 'bloqué') {
    return 'Bloqué';
  }
  return 'Autorisé';
}

export function getEventColor(status: string): string {
  const colors: Record<string, string> = {
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export function getEventDot(status: string): string {
  const dots: Record<string, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };
  return dots[status] || 'bg-muted-foreground';
}

export function getAvatarColor(index: number): string {
  const colors = [
    'bg-rose-500/10 text-rose-600',
    'bg-blue-500/10 text-blue-600',
    'bg-amber-500/10 text-amber-600',
    'bg-indigo-500/10 text-indigo-600',
    'bg-teal-500/10 text-teal-600',
    'bg-purple-500/10 text-purple-600',
    'bg-emerald-500/10 text-emerald-600',
    'bg-orange-500/10 text-orange-600',
  ];
  return colors[index % colors.length];
}
