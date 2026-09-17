'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { delegatesService, type DelegateAnalyticsResponse } from '@/services/delegates';
import { Globe, Trophy, Activity, Loader2 } from 'lucide-react';

const REGIONAL_COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

const STATUS_CONFIG = {
  online: { label: 'Online', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  busy: { label: 'Busy', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  offline: { label: 'Offline', color: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/20' },
  suspended: { label: 'Suspended', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
};

function DonutChart({ data }: { data: { name: string; value: number; color?: string }[] }) {
  const regionalWithColors = data.map((r, i) => ({
    ...r,
    color: r.color || REGIONAL_COLORS[i % REGIONAL_COLORS.length],
  }));
  const total = regionalWithColors.reduce((s, r) => s + r.value, 0);
  let cumulativePercent = 0;

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs italic gap-2">
        <Globe className="h-7 w-7 opacity-30" />
        <span>Aucune donnée régionale disponible</span>
      </div>
    );
  }

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
            <span className="text-lg font-black text-foreground tracking-tight">{total}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Délégués</span>
          </div>
        </div>

        {/* Regional highlight summary */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">
            {data.length} région{data.length > 1 ? 's' : ''} couverte{data.length > 1 ? 's' : ''}
          </div>
          <p className="text-xs text-foreground font-semibold line-clamp-2 leading-snug">
            {data[0]?.name ? `${data[0].name} (${data[0].value} délégué${data[0].value > 1 ? 's' : ''})` : 'Distribution régionale'}
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
                  <span className="text-xs font-bold text-foreground">{region.value}</span>
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
  const [analytics, setAnalytics] = useState<DelegateAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    delegatesService
      .getAnalytics()
      .then((res) => {
        if (!cancelled) {
          setAnalytics(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
            <CardContent className="flex items-center justify-center h-48">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const regionalData = (analytics?.regionalDistribution && analytics.regionalDistribution.length > 0)
    ? analytics.regionalDistribution.map((r, i) => ({
        name: r.name || (r as any).region || 'Non assigné',
        value: Number(r.value) || 0,
        color: REGIONAL_COLORS[i % REGIONAL_COLORS.length],
      }))
    : [];

  const statusCounts = analytics?.statusCounts || { online: 0, busy: 0, offline: 0, suspended: 0 };
  const totalDelegatesCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const topPerformers = analytics?.topPerformers || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Regional Coverage */}
      <Card className="h-full border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Regional Coverage</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Delegate distribution across regions
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {regionalData.reduce((s, r) => s + r.value, 0)} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start space-y-4">
          <DonutChart data={regionalData} />
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="h-full border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Top Performers</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Highest order volume & revenue
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Classement
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start space-y-2.5">
          {topPerformers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs italic gap-2">
              <Trophy className="h-7 w-7 opacity-30" />
              <span>Aucun délégué disponible</span>
            </div>
          ) : (
            topPerformers.map((delegate, i) => (
              <Link
                key={delegate.id}
                href={`/delegates/${delegate.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all border border-border/20 bg-muted/10 hover:border-border/60 hover:shadow-2xs"
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 shadow-xs',
                    i === 0
                      ? 'bg-amber-500 text-white'
                      : i === 1
                      ? 'bg-slate-400 text-white'
                      : i === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-muted text-muted-foreground font-semibold'
                  )}
                >
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {delegate.name}
                    </span>
                    <span className="text-xs font-black text-foreground flex-shrink-0">
                      {formatCurrency(delegate.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/30">
                        {delegate.region || 'Non assigné'}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{delegate.orders} commande{delegate.orders > 1 ? 's' : ''}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0',
                        delegate.completionRate >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : delegate.completionRate >= 50
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}
                    >
                      {delegate.completionRate}%
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="h-full border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Status Overview</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time active shift metrics
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {totalDelegatesCount} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start space-y-2.5">
          <div className="flex flex-col gap-2.5 w-full">
            {(['online', 'busy', 'offline', 'suspended'] as const).map((status) => {
              const count = statusCounts[status] ?? 0;
              const cfg = STATUS_CONFIG[status];
              const pct = totalDelegatesCount > 0 ? Math.round((count / totalDelegatesCount) * 100) : 0;
              return (
                <div
                  key={status}
                  className={cn(
                    'px-3.5 py-2.5 rounded-xl border flex flex-col gap-1.5 transition-all duration-200 hover:shadow-2xs',
                    cfg.bgColor
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.color)} />
                      <span className="text-xs font-bold text-foreground">
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        ({pct}%)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={cn('text-sm font-extrabold tracking-tight', cfg.textColor)}>
                        {count}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {count > 1 ? 'délégués' : 'délégué'}
                      </span>
                    </div>
                  </div>
                  {/* Share Progress Bar */}
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', cfg.color)}
                      style={{ width: `${pct}%` }}
                    />
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
