'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { clientsService } from '@/services/clients';
import { Users, UserCheck, UserX, Target, ShoppingBag, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface KPIData {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change: number;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'gray' | 'amber' | 'red' | 'indigo' | 'teal';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  gray: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
} as const;

function formatValue(val: number, prefix: string, suffix: string) {
  if (val >= 1000000) return prefix + (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' + suffix;
  if (val >= 1000) return prefix + val.toLocaleString('en-US') + suffix;
  return prefix + String(val) + suffix;
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(() => formatValue(target, prefix, suffix));
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
      setDisplay(formatValue(current, prefix, suffix));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, prefix, suffix]);

  return <span>{display}</span>;
}

function KPICard({ kpi }: { kpi: KPIData }) {
  const isPositive = kpi.change >= 0;
  return (
    <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
            {kpi.title}
          </span>
          <div className="text-xl font-bold tracking-tight text-foreground">
            <CountUp target={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
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
}

export function KPICards() {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsService.getKpis().then((data) => {
      setKpis([
        {
          title: 'Total Clients',
          value: data.totalClients,
          change: data.trends.totalClients,
          icon: <Users className="h-5 w-5" />,
          iconColor: 'blue',
          sparkline: data.sparklines?.totalClients || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#2563EB',
        },
        {
          title: 'Active Clients',
          value: data.activeClients,
          change: data.trends.activeClients,
          icon: <UserCheck className="h-5 w-5" />,
          iconColor: 'green',
          sparkline: data.sparklines?.activeClients || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#22C55E',
        },
        {
          title: 'Inactive Clients',
          value: data.inactiveClients,
          change: -Math.abs(data.trends.inactiveClients),
          icon: <UserX className="h-5 w-5" />,
          iconColor: 'gray',
          sparkline: data.sparklines?.inactiveClients || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#6B7280',
        },
        {
          title: 'Monthly Target',
          value: data.targetRevenue ?? 0,
          prefix: '',
          suffix: ' DA',
          change: data.trends.targetRevenue ?? 0,
          icon: <Target className="h-5 w-5" />,
          iconColor: 'amber',
          sparkline: data.sparklines?.targetRevenue || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#F59E0B',
        },
        {
          title: 'Orders This Month',
          value: data.ordersThisMonth,
          change: data.trends.ordersThisMonth,
          icon: <ShoppingBag className="h-5 w-5" />,
          iconColor: 'indigo',
          sparkline: data.sparklines?.ordersThisMonth || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#6366F1',
        },
        {
          title: 'Total Revenue',
          value: data.totalRevenue,
          prefix: '',
          suffix: ' DA',
          change: data.trends.totalRevenue,
          icon: <TrendingUp className="h-5 w-5" />,
          iconColor: 'green',
          sparkline: data.sparklines?.totalRevenue || [0, 0, 0, 0, 0, 0, 0],
          sparkColor: '#22C55E',
        },
      ]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
