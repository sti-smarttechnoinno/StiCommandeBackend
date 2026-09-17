'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { reportsService, type OrderStatusData } from '@/services/reports';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/60 p-2.5 rounded-xl shadow-md text-xs space-y-0.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.payload.label || data.name}
        </div>
        <p className="text-muted-foreground">
          {data.value} Orders <span className="font-bold text-foreground">({data.payload.percentage || 0}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

export function StatusChart() {
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
  }, []);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">Orders by Status</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Live distribution across order lifecycle
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-6 flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading status distribution...</div>
        ) : (
          <>
            {/* Doughnut Chart with Center Metric */}
            <div className="relative h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="count"
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-foreground tracking-tight leading-none">{total}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mt-1">Total</span>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {data.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs"
                >
                  <span className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[100px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-bold text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
