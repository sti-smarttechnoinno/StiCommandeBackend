'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { reportsService, type TopDelegateData } from '@/services/reports';
import { useReportsStore } from '../store';
import { formatCurrency } from '../utils';
import { Trophy } from 'lucide-react';

const MEDAL_COLORS = ['#D71920', '#2563EB', '#F59E0B'];
const AVATAR_COLORS = [
  'bg-rose-500/10 text-rose-600',
  'bg-blue-500/10 text-blue-600',
  'bg-amber-500/10 text-amber-600',
  'bg-indigo-500/10 text-indigo-600',
  'bg-teal-500/10 text-teal-600',
];

export function TopDelegatesCard() {
  const refreshKey = useReportsStore((s) => s.refreshKey);
  const [delegates, setDelegates] = useState<TopDelegateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getTopDelegates()
      .then((res) => {
        if (isMounted) {
          setDelegates(res);
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

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card h-full flex flex-col justify-start">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Top Performing Delegates
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3.5 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading delegates ranking...</div>
        ) : delegates.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Aucun délégué disponible</div>
        ) : (
          <div className="space-y-3">
            {delegates.slice(0, 5).map((delegate, i) => (
              <div
                key={delegate.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group"
              >
                {/* Rank */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: i < 3 ? `${MEDAL_COLORS[i]}15` : 'transparent',
                    color: i < 3 ? MEDAL_COLORS[i] : '#6B7280',
                  }}
                >
                  {i + 1}
                </div>

                {/* Avatar */}
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0', AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                  {delegate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground truncate">{delegate.name}</span>
                    <span className="text-[10px] font-bold text-foreground ml-2">{formatCurrency(delegate.sales)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={delegate.targetAchievement} className="h-1.5 flex-1 bg-muted" />
                    <span className="text-[9px] font-bold text-muted-foreground">{delegate.orders} orders</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
