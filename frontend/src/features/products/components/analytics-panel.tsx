'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { productsService, type ProductAnalyticsResponse } from '@/services/products';
import { PieChart, BarChart3, Package } from 'lucide-react';

const OPERATOR_COLORS: Record<string, string> = {
  Mobilis: '#22C55E',
  Ooredoo: '#EF4444',
  Djezzy: '#F59E0B',
};

export function AnalyticsPanel() {
  const [data, setData] = useState<ProductAnalyticsResponse | null>(null);

  useEffect(() => {
    productsService
      .getAnalytics()
      .then((res) => setData(res))
      .catch(() => {});
  }, []);

  const operatorDist = data?.operatorDistribution ?? [];
  const categoryDist = data?.categoryDistribution ?? [];
  const stockOverview = data?.stockOverview ?? [];

  const maxOperatorVal = Math.max(1, ...operatorDist.map((d) => d.value));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Category Distribution */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Category Distribution</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Product catalog breakdown by category
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-3">
          {categoryDist.length > 0 ? (
            categoryDist.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs border-b border-border/20 pb-2 last:border-0">
                <span className="font-semibold text-foreground capitalize">{cat.name.replace(/_/g, ' ')}</span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{cat.value} items</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No catalog categories yet</p>
          )}
        </CardContent>
      </Card>

      {/* Operator Breakdown */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Telecom Operators</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Product catalog share per operator
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-4">
          {operatorDist.length > 0 ? (
            operatorDist.map((op) => (
              <div key={op.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{op.name}</span>
                  <span className="font-medium text-muted-foreground">{op.value} items</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${(op.value / maxOperatorVal) * 100}%`,
                      backgroundColor: OPERATOR_COLORS[op.name] || '#3B82F6',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No operator data available</p>
          )}
        </CardContent>
      </Card>

      {/* Stock Overview */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Stock Inventory Health</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Inventory availability status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-start space-y-3">
          {stockOverview.length > 0 ? (
            stockOverview.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/30">
                <span className="font-semibold text-foreground">{item.status}</span>
                <span className="font-bold text-foreground">{item.count} products</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No stock status data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
