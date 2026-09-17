'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { KPICards } from '@/features/orders/components/kpi-cards';
import { OrdersTable } from '@/features/orders/components/orders-table';
import { TodaySummary } from '@/features/orders/components/today-summary';
import { ApprovalQueue } from '@/features/orders/components/approval-queue';
import { LiveActivity } from '@/features/orders/components/live-activity';
import { BottomToolbar } from '@/features/orders/components/bottom-toolbar';
import { Download, RefreshCw, Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

export default function OrdersPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Tuesday, July 29, 2026');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info('Refreshing orders data...');
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Orders Page */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  orders
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Orders Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Track, manage, and fulfill all distribution orders across regions.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting report...')}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          {/* New Order Primary Button (Visible only if user has orders.create) */}
          {can('orders.create') && (
            <Button
              size="sm"
              onClick={() => router.push('/orders/new')}
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>New Order</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Full Width Combined Filter & Table Component */}
      <div className="w-full space-y-4">
        <OrdersTable />
        <BottomToolbar />
      </div>

      {/* Bottom Section: Operations & Activity Summary (3 Column Grid Full Width) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Operations & Activity Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          <TodaySummary />
          <ApprovalQueue />
          <LiveActivity />
        </div>
      </div>
    </div>
  );
}
