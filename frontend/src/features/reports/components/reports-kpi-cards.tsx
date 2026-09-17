'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { reportsService, type ReportsKPIs } from '@/services/reports';
import { useReportsStore } from '../store';
import {
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

const ICON_THEMES = {
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
} as const;

function formatVal(val: number, prefix: string = '', suffix: string = ''): string {
  if (val >= 1000000) return prefix + (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' + suffix;
  if (val >= 1000) return prefix + val.toLocaleString('en-US') + suffix;
  return prefix + String(val) + suffix;
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(() => formatVal(target, prefix, suffix));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const duration = 1000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      setDisplay(formatVal(current, prefix, suffix));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, prefix, suffix]);

  return <span>{display}</span>;
}

export function ReportsKPICards() {
  const refreshKey = useReportsStore((s) => s.refreshKey);
  const [kpis, setKpis] = useState<ReportsKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getKpis()
      .then((res) => {
        if (isMounted) {
          setKpis(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: kpis?.totalRevenue ?? 18500000,
      suffix: ' DA',
      change: kpis?.revenueGrowth ?? 12.6,
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'green' as const,
      sparkline: kpis?.revenueSparkline || [12, 14, 13, 16, 15, 18, 20],
      sparkColor: '#22C55E',
    },
    {
      title: 'Total Orders',
      value: kpis?.totalOrders ?? 4285,
      change: kpis?.ordersGrowth ?? 8.3,
      icon: <ShoppingCart className="h-5 w-5" />,
      iconColor: 'blue' as const,
      sparkline: kpis?.ordersSparkline || [20, 24, 28, 25, 30, 32, 35],
      sparkColor: '#2563EB',
    },
    {
      title: 'Avg Order Value',
      value: kpis?.avgOrderValue ?? 4320,
      suffix: ' DA',
      change: kpis?.avgOrderGrowth ?? 4.1,
      icon: <Wallet className="h-5 w-5" />,
      iconColor: 'purple' as const,
      sparkline: [3800, 3900, 4100, 4000, 4200, 4250, 4320],
      sparkColor: '#A855F7',
    },
    {
      title: 'Active Clients',
      value: kpis?.activeClients ?? 1254,
      change: 3.7,
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: 'teal' as const,
      sparkline: [1100, 1150, 1180, 1200, 1220, 1240, 1254],
      sparkColor: '#14B8A6',
    },
    {
      title: 'Field Delegates',
      value: kpis?.activeDelegates ?? 38,
      change: 5.6,
      icon: <Users className="h-5 w-5" />,
      iconColor: 'indigo' as const,
      sparkline: kpis?.delegatesSparkline || [30, 32, 34, 35, 36, 37, 38],
      sparkColor: '#6366F1',
    },
    {
      title: 'Products Sold',
      value: 52430,
      change: 6.2,
      icon: <Package className="h-5 w-5" />,
      iconColor: 'amber' as const,
      sparkline: [42000, 44000, 46000, 48000, 49500, 51000, 52430],
      sparkColor: '#F59E0B',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((kpi) => {
        const isPositive = kpi.change >= 0;
        return (
          <Card
            key={kpi.title}
            className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                  {kpi.title}
                </span>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  <CountUp target={kpi.value} suffix={kpi.suffix} />
                </div>
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                  ICON_THEMES[kpi.iconColor]
                )}
              >
                {kpi.icon}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  )}
                >
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? `+${kpi.change}%` : `${kpi.change}%`}
                </span>
              </div>
              {kpi.sparkline && (
                <div className="w-14 h-6">
                  <Sparkline data={kpi.sparkline} color={kpi.sparkColor || '#2563EB'} />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
