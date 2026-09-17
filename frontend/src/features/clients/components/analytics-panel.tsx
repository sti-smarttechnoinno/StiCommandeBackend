'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { clientsService } from '@/services/clients';
import { Globe, Target, Trophy, Loader2 } from 'lucide-react';

interface RegionalData {
  name: string;
  value: number;
  color: string;
}

interface ObjectiveItem {
  name: string;
  target: number;
  achieved: number;
  percent: number;
  color: string;
}

interface TopDelegate {
  name: string;
  orders: number;
  revenue: number;
  completion: number;
}

const COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

function DonutChart({ data }: { data: RegionalData[] }) {
  const total = data.reduce((s, r) => s + r.value, 0);
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
            {data.map((segment, index) => {
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
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Clients</span>
          </div>
        </div>

        {/* Top summary highlight */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">
            {data.length} région{data.length > 1 ? 's' : ''} couverte{data.length > 1 ? 's' : ''}
          </div>
          <p className="text-xs text-foreground font-semibold line-clamp-2 leading-snug">
            {data[0]?.name ? `${data[0].name} (${data[0].value} client${data[0].value > 1 ? 's' : ''})` : 'Distribution régionale'}
          </p>
        </div>
      </div>

      {/* Clear Region Breakdown List with Progress Bars */}
      <div className="space-y-2.5 pt-2 border-t border-border/30">
        {data.map((region, index) => {
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
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [objectiveData, setObjectiveData] = useState<ObjectiveItem[]>([]);
  const [topDelegates, setTopDelegates] = useState<TopDelegate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsService.getAnalytics().then((data) => {
      setRegionalData(
        data.regionalDistribution.map((r: any, i) => ({
          name: r.name || r.region || 'Non assigné',
          value: Number(r.value) || 0,
          color: COLORS[i % COLORS.length],
        }))
      );
      if (data.objectivePerformance && data.objectivePerformance.length > 0) {
        setObjectiveData(
          data.objectivePerformance.map((c, i) => ({
            name: c.name,
            target: c.target,
            achieved: c.achieved,
            percent: Math.min(100, Math.round(c.percent)),
            color: COLORS[i % COLORS.length],
          }))
        );
      }
      setTopDelegates(data.topDelegates);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Regional Distribution */}
      <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Regional Distribution</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Répartition des clients par région
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {regionalData.reduce((s, r) => s + r.value, 0)} Total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start">
          <DonutChart data={regionalData} />
        </CardContent>
      </Card>

      {/* Objective Attainment */}
      <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Target className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Objective Attainment</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Performance mensuelle des objectifs
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              {objectiveData.length} Suivis
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start space-y-3">
          {objectiveData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs italic gap-2">
              <Target className="h-7 w-7 opacity-30" />
              <span>Aucun objectif configuré pour ce mois</span>
            </div>
          ) : (
            objectiveData.map((item) => (
              <div key={item.name} className="space-y-1.5 p-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors border border-border/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate">{item.name}</span>
                  <span className={cn(
                    'font-bold text-[10px] px-1.5 py-0.5 rounded-full',
                    item.percent >= 100
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : item.percent >= 50
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-amber-500/10 text-amber-600'
                  )}>
                    {item.percent}%
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted/70 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, item.percent)}%`,
                      backgroundColor: item.color || '#10B981',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span>{formatCurrency(item.achieved)} atteint</span>
                  <span>{formatCurrency(item.target)} cible</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Delegates */}
      <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Top Delegates</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Classement par performance commerciale
                </CardDescription>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
              Classement
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 flex-1 flex flex-col justify-start space-y-2.5">
          {topDelegates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs italic gap-2">
              <Trophy className="h-7 w-7 opacity-30" />
              <span>Aucun délégué enregistré</span>
            </div>
          ) : (
            topDelegates.map((delegate, i) => (
              <div
                key={delegate.name}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-border/20 bg-muted/10"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-muted-foreground'
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block truncate">{delegate.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {delegate.orders} commande{delegate.orders > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground flex-shrink-0">
                  {formatCurrency(Number(delegate.revenue) || 0)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
