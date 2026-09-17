'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationsService } from '@/services/notifications';
import { useNotificationsStore } from '../store';
import { PieChart, Sparkles } from 'lucide-react';
import { PieChart as RechartPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PALETTE = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'];

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/70 rounded-2xl shadow-xl p-3 text-card-foreground">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: data.color }} />
        <span className="font-bold text-foreground">{data.name}</span>
      </div>
      <p className="text-base font-black text-foreground mt-1 tracking-tight">{data.value} <span className="text-xs font-medium text-muted-foreground">alerts</span></p>
      <p className="text-[10px] font-semibold text-primary">{pct}% of total alerts</p>
    </div>
  );
}

export function CategoryChartCard() {
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .getAnalytics()
      .then((res) => {
        if (isMounted) {
          const formatted = (res.categoryDistribution || []).map((item, idx) => ({
            ...item,
            color: item.color || PALETTE[idx % PALETTE.length],
          }));
          setData(formatted);
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

  const total = data.reduce((s, r) => s + r.value, 0);

  return (
    <Card className="border border-border/50 shadow-xs hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card flex flex-col justify-start relative group/card">
      {/* Top ambient glow line */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent pointer-events-none" />

      <CardHeader className="p-5 pb-3.5 border-b border-border/30 bg-muted/15 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
              <PieChart className="h-4 w-4" />
            </div>
            <span>Notifications by Category</span>
          </CardTitle>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {data.length} categories
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">Calculating breakdown...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-14 text-center text-xs text-muted-foreground">
            No category distribution available
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Donut Chart */}
            <div className="relative w-[185px] h-[185px] my-1">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={800}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} className="transition-opacity hover:opacity-85 cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip total={total} />} />
                </RechartPie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-foreground tracking-tight leading-none">{total}</span>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-1">Alerts</span>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="space-y-2.5 mt-3 w-full max-h-[175px] overflow-y-auto pr-0.5 scrollbar-thin">
              {data.map((item) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="p-2 rounded-xl hover:bg-muted/30 transition-colors group/item">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shadow-xs flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-foreground truncate text-xs group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">{item.value}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
