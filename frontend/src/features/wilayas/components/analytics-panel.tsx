'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompactCurrency } from '../utils';
import { wilayasService, type WilayasAnalyticsResponse } from '@/services/wilayas';
import { PieChart, Trophy, MapPin, Loader2 } from 'lucide-react';

const REGIONAL_COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

const PERFORMANCE_CONFIG = {
  excellent: { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  good: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  average: { label: 'Average', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  needs_attention: { label: 'Needs Attention', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
};

function DonutChart({ data }: { data: WilayasAnalyticsResponse['regionalDistribution'] }) {
  const regionalWithColors = data.map((r, i) => ({
    ...r,
    color: r.color || REGIONAL_COLORS[i % REGIONAL_COLORS.length],
  }));
  const totalRevenue = regionalWithColors.reduce((s, r) => s + r.revenue, 0);
  let cumulativePercent = 0;

  if (data.length === 0 || totalRevenue === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs italic gap-2">
        <PieChart className="h-7 w-7 opacity-30" />
        <span>Aucune donnée régionale disponible</span>
      </div>
    );
  }

  const formattedTotal =
    totalRevenue >= 1000000
      ? `${(totalRevenue / 1000000).toFixed(1)}M`
      : totalRevenue >= 1000
      ? `${(totalRevenue / 1000).toFixed(0)}K`
      : `${totalRevenue}`;

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-5">
        {/* SVG Donut Chart */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="3.8"
              className="text-muted/30"
            />
            {regionalWithColors.map((segment, index) => {
              const percent = totalRevenue > 0 ? (segment.revenue / totalRevenue) * 100 : 0;
              const dashArray = `${percent} ${100 - percent}`;
              const dashOffset = -cumulativePercent;
              cumulativePercent += percent;
              return (
                <circle
                  key={segment.name || `segment-${index}`}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="3.8"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-black text-foreground tracking-tight">{formattedTotal}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">DA Total</span>
          </div>
        </div>

        {/* Regional highlight summary */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">
            {data.length} région{data.length > 1 ? 's' : ''} active{data.length > 1 ? 's' : ''}
          </div>
          <p className="text-xs text-foreground font-semibold line-clamp-2 leading-snug">
            {data[0]?.name ? `${data[0].name} (${formatCurrency(data[0].revenue)})` : 'Part du chiffre d\'affaires'}
          </p>
        </div>
      </div>

      {/* Clear Region Breakdown List with Progress Bars */}
      <div className="space-y-2.5 pt-2 border-t border-border/30">
        {regionalWithColors.map((region, index) => {
          const share = totalRevenue > 0 ? Math.round((region.revenue / totalRevenue) * 100) : 0;
          return (
            <div key={region.name || `region-${index}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="text-xs font-semibold text-foreground truncate">{region.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-foreground">{formatCurrency(region.revenue)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">({share}%)</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${share}%`, backgroundColor: region.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<WilayasAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wilayasService
      .getAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-48 border border-border/40 shadow-xs rounded-2xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const totalWilayasCount = Object.values(analytics.performanceCounts).reduce((a, b) => a + b, 0) || 58;
  const totalRevenue = analytics.regionalDistribution.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Region Revenue Share */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Regional Revenue Share</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Monthly revenue breakdown across regions
              </CardDescription>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
            {totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M DA` : totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(0)}K DA` : `${totalRevenue} DA`} Total
          </span>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-4">
          <DonutChart data={analytics.regionalDistribution} />
        </CardContent>
      </Card>

      {/* Top 5 Performing Wilayas */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Top Performing Wilayas</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest turnover territory ranks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-2.5">
          {analytics.topPerformers.map((wilaya, i) => (
            <div key={wilaya.id} className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/40 transition-colors">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0
                    ? 'bg-amber-500/10 text-amber-600'
                    : i === 1
                    ? 'bg-slate-500/10 text-slate-600'
                    : i === 2
                    ? 'bg-orange-500/10 text-orange-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {wilaya.name} ({wilaya.code})
                  </span>
                  <span className="text-xs font-bold text-foreground">{wilaya.ordersMonth} orders</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>{formatCurrency(wilaya.monthlyRevenue)}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{wilaya.growth}%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Wilaya Performance Overview */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Performance Breakdown</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {totalWilayasCount} Wilayas operational ratings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start">
          <div className="flex flex-col gap-2.5 w-full">
            {(Object.entries(analytics.performanceCounts) as [string, number][]).map(([key, count]) => {
              const cfg = PERFORMANCE_CONFIG[key as keyof typeof PERFORMANCE_CONFIG];
              const pct = totalWilayasCount > 0 ? Math.round((count / totalWilayasCount) * 100) : 0;
              return (
                <div
                  key={key}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01]',
                    cfg.bgColor
                  )}
                >
                  {/* Indicator Dot + Label */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.color)} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate" title={cfg.label}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Count + % Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className={cn('text-base sm:text-lg font-extrabold tracking-tight leading-none', cfg.textColor)}>
                        {count}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        wilayas
                      </span>
                    </div>

                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none bg-background/80 shadow-2xs border border-border/40',
                      cfg.textColor
                    )}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
