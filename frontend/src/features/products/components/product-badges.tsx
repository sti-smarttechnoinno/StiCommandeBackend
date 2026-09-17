import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExtendedProduct } from '../types';

const STATUS_CONFIG: Record<string, { label: string; style: string; dot: string }> = {
  active: {
    label: 'Active',
    style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  draft: {
    label: 'Draft',
    style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  low_stock: {
    label: 'Low Stock',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  out_of_stock: {
    label: 'Out of Stock',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export function ProductStatusBadge({ product }: { product: Partial<ExtendedProduct> & { status?: string; stock?: number | null; minStock?: number | null; stockQuantity?: number | null; trackStock?: boolean } }) {
  const isTracked = product.trackStock !== false && product.stockQuantity !== null && product.stock !== null;
  const stock = product.stockQuantity ?? product.stock ?? 0;
  const minStock = product.minStock ?? 100;
  let status: string = product.status || 'active';

  if (status === 'active' && isTracked) {
    if (stock === 0) status = 'out_of_stock';
    else if (stock < minStock) status = 'low_stock';
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <Badge
      variant="ghost"
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border-none shadow-2xs',
        cfg.style
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  );
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  mobile_credit: { label: 'Mobile Credit', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
  sim_cards: { label: 'SIM Card', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  scratch_cards: { label: 'Scratch Card', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  accessories: { label: 'Accessory', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  data_packs: { label: 'Data Pack', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  voice_packages: { label: 'Voice Pack', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  sms_packages: { label: 'SMS Pack', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
};

export function CategoryBadge({ category }: { category: string }) {
  const cfg = CATEGORY_CONFIG[category] || { label: category?.replace(/_/g, ' ') || 'Category', color: 'text-slate-600', bg: 'bg-slate-500/10' };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none w-fit', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

const OPERATOR_CONFIG: Record<string, { color: string; bg: string }> = {
  Mobilis: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  Ooredoo: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
  Djezzy: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  '-': { color: 'text-slate-600', bg: 'bg-slate-500/10' },
};

export function OperatorBadge({ operator }: { operator: string }) {
  const cfg = OPERATOR_CONFIG[operator] || OPERATOR_CONFIG['-'];
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-none w-fit', cfg.bg, cfg.color)}>
      {operator}
    </span>
  );
}
