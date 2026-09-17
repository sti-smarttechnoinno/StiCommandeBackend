'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { ShoppingCart, DollarSign, Clock, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { ordersService, type OrderKpis, type OrderData } from '@/services/orders';

export function TodaySummary() {
  const [kpis, setKpis] = useState<OrderKpis | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [validatedCount, setValidatedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    let active = true;
    ordersService.getKpis().then((res) => {
      if (active && res) {
        setKpis(res);
      }
    }).catch(() => {});

    ordersService.list({ pageSize: 100 }).then((res) => {
      if (active && res.data) {
        const items = res.data;
        setTotalCount(res.total || items.length);
        setPendingCount(items.filter((o) => o.status === 'pending').length);
        setValidatedCount(items.filter((o) => o.status === 'validated' || o.status === 'delivered' || o.status === 'processing').length);
        setCancelledCount(items.filter((o) => o.status === 'cancelled').length);
        const rev = items.reduce((acc, o) => acc + (o.status !== 'cancelled' ? Number(o.total_amount) : 0), 0);
        setTotalRevenue(rev);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const total = kpis?.totalOrders ?? totalCount;
  const revenue = kpis?.totalRevenue ?? totalRevenue;
  const pending = kpis?.pendingOrders ?? pendingCount;
  const validated = kpis?.validatedOrders ?? validatedCount;
  const avgOrderVal = total > 0 ? Math.round(revenue / total) : 0;
  const fulfillmentRate = total > 0 ? Math.round((validated / total) * 100) : 100;

  const summaryItems = [
    { label: 'Total Commandes', value: String(total), change: '+100%', icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'Chiffre d\'Affaires', value: formatCurrency(revenue), change: '+100%', icon: <DollarSign className="h-4 w-4" />, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'En Attente', value: String(pending), change: 'En cours', icon: <Clock className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Validées / Livrées', value: String(validated), change: 'Actif', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { label: 'Commandes Annulées', value: String(cancelledCount), change: '0%', icon: <XCircle className="h-4 w-4" />, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Panier Moyen', value: formatCurrency(avgOrderVal), change: 'Moyen', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  ];

  return (
    <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Today&apos;s Summary</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
                Live DB
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Performance globale des commandes en base de données
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1 flex-1">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', item.color)}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Données réelles DB
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-xs font-bold text-foreground tracking-tight">
                  {item.value}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Progress Bar */}
        <div className="pt-3 border-t border-border/30 space-y-1.5 px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Taux de Validation</span>
            <span className="font-bold text-foreground">{fulfillmentRate}%</span>
          </div>
          <Progress
            value={fulfillmentRate}
            className="h-1.5 bg-muted rounded-full"
            indicatorClassName="bg-emerald-500 rounded-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
