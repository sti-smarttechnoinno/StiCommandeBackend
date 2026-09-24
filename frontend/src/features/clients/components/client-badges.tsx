import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ClientStatus, ExtendedClient } from '../types';
import { CheckCircle, Clock, UserX, AlertOctagon, ShieldAlert } from 'lucide-react';

const STATUS_CONFIG: Record<ClientStatus, { label: string; style: string; icon: React.ReactNode }> = {
  active: {
    label: 'Actif',
    style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />,
  },
  inactive: {
    label: 'Inactif',
    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    icon: <UserX className="h-3 w-3 text-slate-600 dark:text-slate-400" />,
  },
  pending: {
    label: 'En attente',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
  },
  blocked: {
    label: 'Bloqué',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: <AlertOctagon className="h-3 w-3 text-rose-600 dark:text-rose-400" />,
  },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="ghost"
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border-none shadow-2xs',
        cfg.style
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </Badge>
  );
}

const TYPE_CONFIG: Record<ExtendedClient['clientType'], { label: string; style: string }> = {
  retail: { label: 'Détail', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  wholesale: { label: 'Gros', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  corporate: { label: 'Entreprise', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  government: { label: 'Public', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

export function ClientTypeBadge({ type }: { type: ExtendedClient['clientType'] }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none w-fit', cfg.style)}>
      {cfg.label}
    </span>
  );
}

const RISK_CONFIG = {
  low: { label: 'Faible', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Moyen', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  high: { label: 'Élevé', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold' },
};

export function RiskLevelBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border-none', cfg.style)}>
      {level === 'high' && <ShieldAlert className="h-3 w-3 text-rose-600 dark:text-rose-400" />}
      {cfg.label}
    </span>
  );
}
