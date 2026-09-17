'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface InventoryCardProps {
  label: string;
  value: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'warning';
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'purple' | 'red' | 'teal';
}

const ICON_COLORS = {
  blue: 'bg-info/10 text-info',
  green: 'bg-success/10 text-success',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-destructive/10 text-destructive',
  teal: 'bg-teal-100 text-teal-600',
} as const;

export function InventoryCard({ label, value, trend, trendType, icon, iconColor }: InventoryCardProps) {
  return (
    <Card className={cn('p-5 transition-all duration-200 hover:shadow-md border-border/50', trendType === 'warning' && 'border-warning/30')}>
      <div className="flex items-start gap-3.5">
        <div className={cn('w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-shrink-0', ICON_COLORS[iconColor])}>
          {icon}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground font-medium mb-1">{label}</span>
          <span className="block text-2xl font-extrabold text-foreground tracking-tight leading-tight mb-1">{value}</span>
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium',
            trendType === 'positive' && 'text-success',
            trendType === 'negative' && 'text-destructive',
            trendType === 'warning' && 'text-warning',
          )}>
            {trendType === 'positive' && <TrendingUp className="h-3 w-3" />}
            {trendType === 'negative' && <TrendingDown className="h-3 w-3" />}
            {trendType === 'warning' && <AlertTriangle className="h-3 w-3" />}
            {trend}
          </span>
        </div>
      </div>
    </Card>
  );
}
