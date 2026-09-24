'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { KPICards } from '@/features/clients/components/kpi-cards';
import { ClientsTable } from '@/features/clients/components/clients-table';
import { BottomToolbar } from '@/features/clients/components/bottom-toolbar';
import { AnalyticsPanel } from '@/features/clients/components/analytics-panel';
import { ImportClientsDialog } from '@/features/clients/components/import-clients-dialog';
import { Plus, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useWebSocketOrders } from '@/hooks/use-websocket-orders';
import { usePermissions } from '@/hooks/use-permissions';

export default function ClientsPage() {
  const { can } = usePermissions();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isConnected, lastEvent } = useWebSocketOrders();
  const [tableKey, setTableKey] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'ORDER_CREATED') {
      setTableKey((prev) => prev + 1);
    }
  }, [lastEvent]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTableKey((prev) => prev + 1);
    toast.info('Actualisation des données clients...');
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Clients Page */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Accueil
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/clients" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  clients
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Gestion des clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos clients, suivez les limites de crédit et soldes impayés, et supervisez les attributions.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Import Clients */}
          <ImportClientsDialog buttonLabel="Importer Clients" onSuccess={handleRefresh} />

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exportation du rapport...')}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Exporter</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Actualiser</span>
          </Button>

          {/* New Client Primary Button (Visible only if can('clients.create')) */}
          {can('clients.create') && (
            <Link href="/clients/new">
              <Button
                size="sm"
                className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                <span>Nouveau Client</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards key={`kpi-${tableKey}`} />

      {/* Full Width Combined Filter & Table Component */}
      <div className="w-full space-y-4">
        <ClientsTable key={`table-${tableKey}`} />
        <BottomToolbar onSuccess={handleRefresh} />
      </div>

      {/* Bottom Section: Operations & Analytics Summary (3 Column Grid Full Width) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Operations & Analytics Summary</h2>
        <AnalyticsPanel />
      </div>
    </div>
  );
}
