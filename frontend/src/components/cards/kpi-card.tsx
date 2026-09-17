'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkline } from '@/components/charts/sparkline';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'amber' | 'orange' | 'indigo' | 'red' | 'teal' | 'purple' | 'gray';
  sparkData?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  orange: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  gray: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
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

export function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  subtitle,
  icon,
  iconColor,
  sparkData,
  sparkColor,
}: KPICardProps) {
  const isPositive = (trend ?? 0) >= 0;
  const colorKey = (iconColor === 'orange' ? 'amber' : iconColor) as keyof typeof ICON_THEMES;

  return (
    <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
            {title}
          </span>
          <div className="text-xl font-bold tracking-tight text-foreground">
            <CountUp target={value} prefix={prefix} suffix={suffix} />
          </div>
        </div>
        <div
          className={cn(
            'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            ICON_THEMES[colorKey] || ICON_THEMES.blue
          )}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1">
          {trend !== undefined ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? `+${trend}%` : `${trend}%`}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground">
              {subtitle || 'Real-time'}
            </span>
          )}
        </div>
        {sparkData && sparkData.length > 0 && (
          <div className="w-14 h-6">
            <Sparkline data={sparkData} color={sparkColor || '#2563EB'} />
          </div>
        )}
      </div>
    </Card>
  );
}
