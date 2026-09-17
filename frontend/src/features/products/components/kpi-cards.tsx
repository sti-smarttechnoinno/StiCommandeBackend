'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { productsService, type ProductKpisResponse } from '@/services/products';
import { Package, Smartphone, CreditCard, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
} as const;

export function KPICards() {
  const [kpis, setKpis] = useState<ProductKpisResponse | null>(null);

  useEffect(() => {
    productsService
      .getKpis()
      .then((data) => setKpis(data))
      .catch(() => {});
  }, []);

  const totalProducts = kpis?.totalProducts ?? 0;
  const activeProducts = kpis?.activeProducts ?? 0;
  const totalStock = kpis?.totalStock ?? 0;
  const lowStock = kpis?.lowStockCount ?? 0;
  const outOfStock = kpis?.outOfStockCount ?? 0;
  const catalogValue = kpis?.catalogValue ?? 0;

  const cards = [
    {
      title: 'Total Products',
      value: totalProducts,
      suffix: '',
      change: kpis?.trends?.totalProducts ?? 0,
      icon: <Package className="h-5 w-5" />,
      iconColor: 'blue' as const,
    },
    {
      title: 'Active Catalog',
      value: activeProducts,
      suffix: '',
      change: kpis?.trends?.activeProducts ?? 0,
      icon: <Smartphone className="h-5 w-5" />,
      iconColor: 'green' as const,
    },
    {
      title: 'Total Stock Units',
      value: totalStock,
      suffix: ' units',
      change: kpis?.trends?.totalStock ?? 0,
      icon: <CreditCard className="h-5 w-5" />,
      iconColor: 'indigo' as const,
    },
    {
      title: 'Low Stock Alert',
      value: lowStock,
      suffix: '',
      change: 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor: 'amber' as const,
    },
    {
      title: 'Out of Stock',
      value: outOfStock,
      suffix: '',
      change: 0,
      icon: <TrendingUp className="h-5 w-5" />,
      iconColor: 'red' as const,
    },
    {
      title: 'Catalog Value',
      value: catalogValue,
      isCurrency: true,
      change: kpis?.trends?.catalogValue ?? 0,
      icon: <Wallet className="h-5 w-5" />,
      iconColor: 'teal' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((kpi) => {
        let formattedVal = String(kpi.value);
        if (kpi.isCurrency) {
          formattedVal = new Intl.NumberFormat('fr-DZ', {
            style: 'currency',
            currency: 'DZD',
            maximumFractionDigits: 0,
          }).format(kpi.value);
        } else if (typeof kpi.value === 'number') {
          formattedVal = kpi.value.toLocaleString() + (kpi.suffix || '');
        }

        return (
          <Card
            key={kpi.title}
            className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex-1 min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {kpi.title}
                </span>
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                    {formattedVal}
                  </span>
                </div>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[kpi.iconColor])}>
                {kpi.icon}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
