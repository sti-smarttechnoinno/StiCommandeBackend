'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'teal' | 'cyan' | 'red';
  onClick?: () => void;
}

const COLOR_BADGES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  orange: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
} as const;

export function ActionCard({ title, description, icon, color, onClick }: ActionCardProps) {
  return (
    <Card
      className={cn(
        'group relative p-5 cursor-pointer rounded-2xl bg-card border border-border/40 shadow-xs',
        'hover:bg-muted/40 hover:shadow-sm transition-all duration-200'
      )}
      onClick={onClick}
    >
      {/* Action Arrow Icon Top Right */}
      <div className="absolute top-4 right-4 text-muted-foreground/30 group-hover:text-foreground transition-colors">
        <ArrowUpRight className="h-4 w-4" />
      </div>

      <div className="flex flex-col items-start space-y-3">
        {/* Icon Container */}
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', COLOR_BADGES[color])}>
          {icon}
        </div>

        {/* Text Content */}
        <div>
          <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
            {title}
          </span>
          <span className="block text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        </div>
      </div>
    </Card>
  );
}
