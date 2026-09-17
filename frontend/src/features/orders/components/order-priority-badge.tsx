import { cn } from '@/lib/utils';
import type { ExtendedOrder } from '../types';
import { Shield, AlertCircle, Zap } from 'lucide-react';

const PRIORITY_CONFIG: Record<ExtendedOrder['priority'], { label: string; style: string; icon?: React.ReactNode }> = {
  low: {
    label: 'Low',
    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  },
  normal: {
    label: 'Normal',
    style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400" />,
  },
  high: {
    label: 'High',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium',
    icon: <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
  },
  urgent: {
    label: 'Urgent',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold',
    icon: <Zap className="h-3 w-3 text-rose-600 dark:text-rose-400 animate-pulse" />,
  },
};

export function OrderPriorityBadge({ priority }: { priority: ExtendedOrder['priority'] }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none w-fit',
        cfg.style
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}
