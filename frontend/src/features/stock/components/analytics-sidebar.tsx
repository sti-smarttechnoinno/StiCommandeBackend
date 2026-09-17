'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { stockService, type StockAnalyticsResponse } from '@/services/stock';
import { useStockStore } from '../store';
import type { LowStockItem, WarehouseActivity } from '../types';
import { PieChart, AlertTriangle, Warehouse, ArrowDown, ArrowUp, RefreshCw, Sliders } from 'lucide-react';
import { toast } from 'sonner';

function SummaryDonut({
  summary,
}: {
  summary: { incoming: number; outgoing: number; transfers: number; adjustments: number };
}) {
  const summaryData = [
    { name: 'Incoming', value: summary.incoming, color: '#22C55E', icon: <ArrowDown className="h-3 w-3" /> },
    { name: 'Outgoing', value: summary.outgoing, color: '#EF4444', icon: <ArrowUp className="h-3 w-3" /> },
    { name: 'Transfers', value: summary.transfers, color: '#2563EB', icon: <RefreshCw className="h-3 w-3" /> },
    { name: 'Adjustments', value: summary.adjustments, color: '#F59E0B', icon: <Sliders className="h-3 w-3" /> },
  ];

  const total = summaryData.reduce((s, r) => s + r.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {summaryData.map((segment) => {
            const percent = total > 0 ? (segment.value / total) * 100 : 0;
            const dashArray = `${percent} ${100 - percent}`;
            const offset = -cumulativePercent;
            cumulativePercent += percent;
            return (
              <circle
                key={segment.name}
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={segment.color}
                strokeWidth="4"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-foreground leading-none">{total.toLocaleString()}</span>
          <span className="text-[9px] font-semibold text-muted-foreground uppercase mt-0.5">Total</span>
        </div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {summaryData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground font-medium">{item.name}</span>
            </div>
            <span className="font-bold text-foreground">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LowStockCard({ lowStock }: { lowStock: LowStockItem[] }) {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Low Stock Alerts</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
            {lowStock.length} Items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {lowStock.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              All product stock levels are currently healthy!
            </div>
          ) : (
            lowStock.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    item.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-foreground truncate">{item.product}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        item.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                      )}
                    >
                      {item.currentStock} units
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
                        item.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(100, Math.max((item.currentStock / Math.max(1, item.minimumStock)) * 100, 5))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info('Navigating to full inventory alerts list')}
          className="w-full mt-4 h-8 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl"
        >
          View All Alerts
        </Button>
      </CardContent>
    </Card>
  );
}

function WarehouseActivityCard({ warehouses }: { warehouses: WarehouseActivity[] }) {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-primary" />
          Warehouse Capacity Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-3.5">
          {warehouses.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No warehouse data registered yet.
            </div>
          ) : (
            warehouses.map((wh) => (
              <div key={wh.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{wh.name}</span>
                  <span className="font-bold text-foreground">{wh.utilization}%</span>
                </div>
                <Progress
                  value={wh.utilization}
                  className="h-2 rounded-full"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsSidebar() {
  const { refreshTrigger } = useStockStore();
  const [data, setData] = useState<StockAnalyticsResponse>({
    summary: { incoming: 0, outgoing: 0, transfers: 0, adjustments: 0 },
    lowStock: [],
    warehouses: [],
  });

  useEffect(() => {
    let active = true;

    stockService.getAnalytics().then((res) => {
      if (active) {
        setData(res);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return (
    <>
      {/* Today's Movement Breakdown */}
      <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Stock Movement Share
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <SummaryDonut summary={data.summary} />
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <LowStockCard lowStock={data.lowStock} />

      {/* Warehouse Utilization */}
      <WarehouseActivityCard warehouses={data.warehouses} />
    </>
  );
}
