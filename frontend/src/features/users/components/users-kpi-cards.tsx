'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { usersService, type UserKpiResponse } from '@/services/users';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Activity,
  Lock,
  Wifi,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

interface KPIData {
  title: string;
  value: number;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor: 'red' | 'blue' | 'indigo' | 'green' | 'rose' | 'emerald';
  sparkline?: number[];
  sparkColor?: string;
  extra?: string;
  isLive?: boolean;
}

const ICON_THEMES = {
  red: 'bg-rose-500/10 text-rose-600',
  blue: 'bg-blue-500/10 text-blue-600',
  indigo: 'bg-indigo-500/10 text-indigo-600',
  green: 'bg-emerald-500/10 text-emerald-600',
  rose: 'bg-rose-500/10 text-rose-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
} as const;

function useCountUp(target: number, duration: number = 1000) {
  const [display, setDisplay] = useState(() => target.toString());
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      setDisplay(current.toString());
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

export function UsersKPICards() {
  const [kpiData, setKpiData] = useState<UserKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    usersService
      .getKpis()
      .then((res) => {
        if (!cancelled) {
          setKpiData(res);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis: KPIData[] = [
    {
      title: 'Total Users',
      value: kpiData?.totalUsers ?? 0,
      change: kpiData?.trends?.totalUsers ?? 0,
      changeLabel: 'growth',
      icon: <Users className="h-5 w-5" />,
      iconColor: 'red',
      sparkline: kpiData?.sparklines?.totalUsers || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#D71920',
    },
    {
      title: 'Administrators',
      value: kpiData?.systemAdmins ?? 0,
      changeLabel: 'System Access',
      icon: <ShieldCheck className="h-5 w-5" />,
      iconColor: 'blue',
      sparkline: kpiData?.sparklines?.systemAdmins || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#2563EB',
    },
    {
      title: 'Active Users',
      value: kpiData?.activeUsers ?? 0,
      change: kpiData?.trends?.activeUsers ?? 0,
      changeLabel: 'active',
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: 'indigo',
      sparkline: kpiData?.sparklines?.activeUsers || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#6366F1',
    },
    {
      title: 'Online Now',
      value: kpiData?.onlineNow ?? 0,
      isLive: true,
      icon: <Wifi className="h-5 w-5" />,
      iconColor: 'emerald',
      sparkline: kpiData?.sparklines?.onlineNow || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#22C55E',
    },
    {
      title: 'Security Alerts',
      value: kpiData?.securityAlerts ?? 0,
      changeLabel: 'Security Alert',
      icon: <Lock className="h-5 w-5" />,
      iconColor: 'rose',
      sparkline: kpiData?.sparklines?.securityAlerts || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#EF4444',
    },
    {
      title: 'Password Rotation',
      value: kpiData?.passwordExpiries ?? 0,
      changeLabel: 'Due Soon',
      icon: <Activity className="h-5 w-5" />,
      iconColor: 'green',
      sparkline: kpiData?.sparklines?.passwordExpiries || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#22C55E',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.title}
          className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                {kpi.title}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  <CountUpDisplay target={kpi.value} />
                </span>
                {kpi.extra && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ({kpi.extra})
                  </span>
                )}
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
              {kpi.change !== undefined ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                    kpi.change >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  )}
                >
                  {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change >= 0 ? `+${kpi.change}%` : `${kpi.change}%`}
                </span>
              ) : kpi.isLive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.changeLabel}</span>
              )}
            </div>

            {kpi.sparkline && (
              <div className="w-14 h-6">
                <Sparkline data={kpi.sparkline} color={kpi.sparkColor || '#D71920'} />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CountUpDisplay({ target }: { target: number }) {
  const val = useCountUp(target);
  return <span>{val}</span>;
}
