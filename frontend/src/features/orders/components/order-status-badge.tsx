import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';
import { Clock, CheckCircle, Package, Truck, XCircle, AlertOctagon, AlertCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    icon: <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
  },
  validated: {
    label: 'Validated',
    style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />,
  },
  partially_validated: {
    label: 'Validated (Partial)',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
  },
  preparing: {
    label: 'Preparing',
    style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    icon: <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />,
  },
  delivered: {
    label: 'Delivered',
    style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    icon: <Truck className="h-3 w-3 text-purple-600 dark:text-purple-400" />,
  },
  rejected: {
    label: 'Rejected',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />,
  },
  cancelled: {
    label: 'Cancelled',
    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    icon: <AlertOctagon className="h-3 w-3 text-slate-600 dark:text-slate-400" />,
  },
};

export function OrderStatusBadge({
  status,
  isVirtual = false,
}: {
  status: OrderStatus | string;
  isVirtual?: boolean;
}) {
  // For Recharge Électronique (Virtual orders), "delivered" must be displayed as "validated"
  const effectiveStatus = isVirtual && status === 'delivered' ? 'validated' : status;
  const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  return (
    <Badge
      variant="ghost"
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit border-none',
        cfg.style
      )}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </Badge>
  );
}
