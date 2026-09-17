'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { notificationsService, type NotificationsKPIMetrics } from '@/services/notifications';
import { useNotificationsStore } from '../store';
import {
  Bell,
  Mail,
  TriangleAlert,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';

const ICON_THEMES = {
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
} as const;

function formatVal(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US');
  return String(val);
}

function CountUp({ target }: { target: number }) {
  const [display, setDisplay] = useState(() => formatVal(target));
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
      setDisplay(formatVal(current));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return <span>{display}</span>;
}

export function NotificationsKPICards() {
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const [metrics, setMetrics] = useState<NotificationsKPIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .getKpis()
      .then((res) => {
        if (isMounted) {
          setMetrics(res);
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

  const kpis = [
    {
      title: 'All Notifications',
      value: metrics?.totalNotifications ?? 0,
      change: metrics?.trends.totalNotifications ?? 0,
      hasChangeNum: true,
      changeLabel: 'Real-time',
      icon: <Bell className="h-5 w-5" />,
      iconColor: 'blue' as const,
      sparkline: metrics?.sparklines.totalNotifications || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#2563EB',
    },
    {
      title: 'Unread',
      value: metrics?.unreadCount ?? 0,
      change: 0,
      hasChangeNum: false,
      changeLabel: 'Need Review',
      icon: <Mail className="h-5 w-5" />,
      iconColor: 'amber' as const,
      sparkline: metrics?.sparklines.unreadCount || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#F59E0B',
    },
    {
      title: 'Critical Alerts',
      value: metrics?.criticalAlerts ?? 0,
      change: 0,
      hasChangeNum: false,
      changeLabel: 'Immediate Action',
      icon: <TriangleAlert className="h-5 w-5" />,
      iconColor: 'red' as const,
      sparkline: metrics?.sparklines.criticalAlerts || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#EF4444',
    },
    {
      title: 'Pending Actions',
      value: metrics?.pendingActions ?? 0,
      change: 0,
      hasChangeNum: false,
      changeLabel: 'Requires Action',
      icon: <Clock className="h-5 w-5" />,
      iconColor: 'orange' as const,
      sparkline: metrics?.sparklines.pendingActions || [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#F97316',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="p-4 flex items-center justify-center h-28 border-border/40 bg-card"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
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
                  <CountUp target={kpi.value} />
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
                {kpi.hasChangeNum ? (
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
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {kpi.changeLabel}
                  </span>
                )}
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
