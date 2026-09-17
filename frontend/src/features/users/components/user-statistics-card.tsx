'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usersService, type UserAnalyticsResponse } from '@/services/users';
import { PieChart, Loader2 } from 'lucide-react';
import { PieChart as RechartPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563EB', '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-lg p-3 text-card-foreground">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="font-semibold text-foreground">{data.name}</span>
      </div>
      <p className="text-sm font-bold text-foreground mt-1">{data.value} users</p>
      <p className="text-[10px] text-muted-foreground">{pct}% of total</p>
    </div>
  );
}

export function UserStatisticsCard() {
  const [analytics, setAnalytics] = useState<UserAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    usersService
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
      <Card className="border border-border/40 shadow-xs rounded-[20px] p-6 flex items-center justify-center bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const roleData = (analytics?.roleDistribution || [
    { name: 'Administrator', value: 1 },
    { name: 'Viewer', value: 0 },
  ]).map((r, i) => ({
    ...r,
    color: COLORS[i % COLORS.length],
  }));

  const totalUsers = roleData.reduce((s, r) => s + r.value, 0);

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          User Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col items-center">
          <div className="relative w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1000}
                  stroke="none"
                >
                  {roleData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={totalUsers} />} />
              </RechartPie>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-foreground leading-none">{totalUsers}</span>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase mt-1">Users</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
            {roleData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
