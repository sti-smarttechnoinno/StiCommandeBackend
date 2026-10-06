'use client';

import { useState, useEffect } from 'react';
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
import { Globe, RefreshCw, Download } from 'lucide-react';
import { PipelineKpisCards } from '@/features/crm/components/pipeline-kpis';
import { KanbanBoard } from '@/features/crm/components/kanban-board';
import { regionsService } from '@/services/regions';
import { usePermissions } from '@/hooks/use-permissions';
import { RoleGuard } from '@/components/auth/role-guard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CrmPipelinePage() {
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
    toast.info('Actualisation du pipeline commercial...');
    window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
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
                <BreadcrumbLink href="/crm/pipeline" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Pipeline Commercial
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Pipeline Commercial & Kanban
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivez la progression des négociations par étape, estimez les prévisions de vente et convertissez en commandes.
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
            onClick={() => toast.info('Exportation des opportunités en cours...')}
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
        </div>
      </div>

      {/* KPI Cards */}
      <PipelineKpisCards region={selectedRegion} />

      {/* Kanban Board */}
      <div className="w-full space-y-4">
        <KanbanBoard region={selectedRegion} />
      </div>
    </div>
    </RoleGuard>
  );
}
