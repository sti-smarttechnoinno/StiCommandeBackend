'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsService, type OrderStatusData } from '@/services/reports';
import { useReportsStore } from '../store';
import { PieChart } from 'lucide-react';
import { PieChart as RechartPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-lg p-3">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="font-semibold text-foreground">{data.label}</span>
      </div>
      <p className="text-sm font-bold text-foreground mt-1">{data.count.toLocaleString()} orders</p>
      <p className="text-[10px] text-muted-foreground">{data.percentage}% of total</p>
    </div>
  );
}

export function OrdersStatusChart() {
  const refreshKey = useReportsStore((s) => s.refreshKey);
  const [data, setData] = useState<OrderStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getOrderStatusDistribution()
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
  }, [refreshKey]);

  const total = data.reduce((s, r) => s + r.count, 0);

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-2 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          Orders by Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading status chart...</div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-[180px] h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPie>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    animationDuration={1000}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartPie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-foreground leading-none">{total.toLocaleString()}</span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase mt-1">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
              {data.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground font-medium truncate max-w-[80px]">{item.label}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
