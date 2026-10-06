'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, RefreshCw, Plus, Download } from 'lucide-react';
import { QuoteKpiCards } from '@/features/crm/components/quote-kpi-cards';
import { QuotesTable } from '@/features/crm/components/quotes-table';
import { regionsService } from '@/services/regions';
import { usePermissions } from '@/hooks/use-permissions';
import { RoleGuard } from '@/components/auth/role-guard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CrmQuotesPage() {
  const { user } = usePermissions();
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    regionsService
      .list()
      .then((res) => {
        if (res?.data) {
          const names = Array.from(new Set(res.data.map((r) => r.name).filter(Boolean)));
          setRegions(names);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info('Actualisation des devis...');
    window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
    setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <RoleGuard requiredPermission="crm.view">
      <div className="space-y-8">
      {/* Page Header / Hero */}
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
                <BreadcrumbLink href="/crm/pipeline" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  CRM
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/crm/quotes" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Devis & Proformas
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Devis & Factures Proforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Établissez des offres commerciales professionnelles, suivez leur validation et convertissez-les en commandes en un clic.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {regions.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/70 shadow-xs">
              <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <Select value={selectedRegion} onValueChange={(val) => setSelectedRegion(val || 'all')}>
                <SelectTrigger className="h-6 text-xs border-0 bg-transparent p-0 focus:ring-0 w-[125px] font-semibold text-foreground shadow-none">
                  <SelectValue placeholder="Toutes régions" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-medium">Toutes régions</SelectItem>
                  {regions.map((reg) => (
                    <SelectItem key={reg} value={reg} className="text-xs font-medium">
                      {reg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exportation des devis en cours...')}
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

          {/* New Quote Primary Button */}
          <Link href="/crm/quotes/new">
            <Button
              size="sm"
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>Nouveau Devis</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <QuoteKpiCards region={selectedRegion} />

      {/* Quotes Table */}
      <div className="w-full space-y-4">
        <QuotesTable region={selectedRegion} />
      </div>
    </div>
    </RoleGuard>
  );
}
