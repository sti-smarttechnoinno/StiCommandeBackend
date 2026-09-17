'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useWilayasStore } from '@/features/wilayas/store';
import { KPICards } from '@/features/wilayas/components/kpi-cards';
import { WilayasTable } from '@/features/wilayas/components/wilayas-table';
import { AnalyticsPanel } from '@/features/wilayas/components/analytics-panel';
import { WilayaDrawer } from '@/features/wilayas/components/wilaya-drawer';
import { Plus, Download, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WilayasPage() {
  const { selectedWilaya, setSelectedWilaya } = useWilayasStore();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    toast.info('Refreshing wilayas data from backend...');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const handleViewWilaya = useCallback(
    (id: string) => {
      setSelectedWilaya(id);
    },
    [setSelectedWilaya]
  );

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Wilayas Page */}
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
                <BreadcrumbLink href="/wilayas" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  wilayas
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Wilayas Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Analyze revenue, clients, delegates and sales performance across all 58 Algerian wilayas.
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

          {/* New Wilaya Primary Button */}
          <Button
            size="sm"
            onClick={() => toast.success('Add Wilaya Dialog')}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
            <span>New Wilaya</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards key={`kpi-${refreshTrigger}`} />

      {/* Full Width Combined Filter & Table Component */}
      <div className="w-full">
        <WilayasTable onViewWilaya={handleViewWilaya} refreshTrigger={refreshTrigger} />
      </div>

      {/* Bottom Section: Operations & Performance Summary (3 Column Grid Full Width) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Performance & Regional Summary</h2>
        <AnalyticsPanel key={`analytics-${refreshTrigger}`} />
      </div>

      {/* Wilaya Details Drawer */}
      {selectedWilaya && (
        <WilayaDrawer wilayaId={selectedWilaya} onClose={() => setSelectedWilaya(null)} />
      )}
    </div>
  );
}
