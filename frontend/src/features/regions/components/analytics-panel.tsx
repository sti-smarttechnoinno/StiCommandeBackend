'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { regionsService, type RegionsAnalyticsResponse } from '@/services/regions';
import { Globe, Trophy, ShieldCheck, UserX } from 'lucide-react';

interface AnalyticsPanelProps {
  analytics?: RegionsAnalyticsResponse | null;
}

const REGIONAL_COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

function DonutChart({
  data,
  totalRevenue,
}: {
  data: { name: string; value: number; color?: string }[];
  totalRevenue: number;
}) {
  const regionalWithColors = data.map((r, i) => ({
    ...r,
    color: r.color || REGIONAL_COLORS[i % REGIONAL_COLORS.length],
  }));
  const total = totalRevenue > 0 ? totalRevenue : regionalWithColors.reduce((s, r) => s + r.value, 0);
  let cumulativePercent = 0;

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs italic gap-2">
        <Globe className="h-7 w-7 opacity-30" />
        <span>Aucune donnée régionale disponible</span>
      </div>
    );
  }

  const formattedTotal =
    total >= 1000000
      ? `${(total / 1000000).toFixed(1)}M`
      : total >= 1000
      ? `${(total / 1000).toFixed(0)}K`
      : `${total}`;

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
              const percent = total > 0 ? (segment.value / total) * 100 : 0;
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
            {data[0]?.name ? `${data[0].name} (${formatCurrency(data[0].value)})` : 'Part du chiffre d\'affaires'}
          </p>
        </div>
      </div>

      {/* Clear Region Breakdown List with Progress Bars */}
      <div className="space-y-2.5 pt-2 border-t border-border/30">
        {regionalWithColors.map((region, index) => {
          const share = total > 0 ? Math.round((region.value / total) * 100) : 0;
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
                  <span className="text-xs font-bold text-foreground">{formatCurrency(region.value)}</span>
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

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const [data, setData] = useState<RegionsAnalyticsResponse | null>(analytics || null);
  const [loading, setLoading] = useState(!analytics);

  useEffect(() => {
    if (analytics) {
      setData(analytics);
      setLoading(false);
      return;
    }

    let isMounted = true;
    regionsService
      .getAnalytics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analytics]);

  const regionalRevenue = data?.regionalRevenue || [];
  const topLeaders = data?.topLeaders || [];
  const wilayaStatus = data?.wilayaStatus || [
    { label: 'Active Coverage', count: 0, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Limited Operations', count: 0, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Pending Expansion', count: 58, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Inactive Zones', count: 0, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
  ];
  const totalRevenue = data?.totalRevenue || 0;
  const totalWilayas = data?.totalWilayas || 58;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Regional Revenue Distribution */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Regional Revenue Share</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Total market turnover by territory
              </CardDescription>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
            {totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M DA` : totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(0)}K DA` : `${totalRevenue} DA`} Total
          </span>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-4">
          {loading ? (
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse" />
          ) : (
            <DonutChart data={regionalRevenue} totalRevenue={totalRevenue} />
          )}
        </CardContent>
      </Card>

      {/* Top Regional Delegates */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Top Regional Leaders</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest performing territory delegates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topLeaders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 flex-1 my-auto">
              <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground">
                <UserX className="h-5 w-5 text-muted-foreground/70" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">No Regional Leaders Yet</p>
                <p className="text-[11px] text-muted-foreground max-w-[220px]">
                  Delegate rankings will appear here as orders are processed in territories.
                </p>
              </div>
            </div>
          ) : (
            topLeaders.map((delegate, i) => (
              <div key={delegate.name} className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/40 transition-colors">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0 ? 'bg-amber-500/10 text-amber-600' :
                  i === 1 ? 'bg-slate-500/10 text-slate-600' :
                  i === 2 ? 'bg-orange-500/10 text-orange-600' :
                  'bg-muted text-muted-foreground'
                )}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">{delegate.name} ({delegate.region})</span>
                    <span className="text-xs font-bold text-foreground">{delegate.orders} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{formatCurrency(delegate.revenue)}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{delegate.completion}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Wilaya Status Overview */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Coverage & Health</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {totalWilayas} Wilayas operational breakdown
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start">
          <div className="flex flex-col gap-2.5 w-full">
            {wilayaStatus.map((item) => {
              const pct = totalWilayas > 0 ? Math.round((item.count / totalWilayas) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01]',
                    item.bgColor
                  )}
                >
                  {/* Indicator Dot + Label */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', item.color)} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate" title={item.label}>
                      {item.label}
                    </span>
                  </div>

                  {/* Count + % Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className={cn('text-base sm:text-lg font-extrabold tracking-tight leading-none', item.textColor)}>
                        {item.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        wilayas
                      </span>
                    </div>

                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none bg-background/80 shadow-2xs border border-border/40',
                      item.textColor
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
