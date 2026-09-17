'use client';

import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store';
import { reportsService, type RevenueOverviewData } from '@/services/reports';
import { TrendingUp, DollarSign } from 'lucide-react';

const DATA_RANGES = {
  '7': '7d',
  '30': '30d',
  '90': '90d',
  '365': '1y',
} as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/60 p-3 rounded-xl shadow-md space-y-1 min-w-[160px]">
        <p className="text-xs font-semibold text-foreground pb-1 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between text-xs gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold text-foreground">
              {entry.dataKey === 'revenue' ? `${entry.value.toLocaleString('en-US')} DA` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  const { dateRange, setDateRange } = useDashboardStore();
  const [data, setData] = useState<RevenueOverviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeKey = DATA_RANGES[dateRange as keyof typeof DATA_RANGES] || '30d';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    reportsService
      .getRevenueOverview(rangeKey)
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
  }, [rangeKey]);

  const totalRevenue = useMemo(() => data.reduce((acc, curr) => acc + (curr.revenue || 0), 0), [data]);
  const totalOrders = useMemo(() => data.reduce((acc, curr) => acc + (curr.orders || 0), 0), [data]);

  return (
    <Card className="col-span-1 lg:col-span-2 border border-border/40 shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold tracking-tight">Revenue Overview</CardTitle>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> +24%
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Financial performance for the last {dateRange} days
          </CardDescription>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl self-start sm:self-auto">
          {(['7', '30', '90', '365'] as const).map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              className={`h-7 px-3 text-xs font-medium rounded-lg transition-all ${
                dateRange === range
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setDateRange(range)}
            >
              {range === '365' ? '1 Year' : `${range}D`}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D71920" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D71920" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.1)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 16 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue (DA)"
              stroke="#D71920"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#ordersGrad)"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
