'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useRegionsStore } from '@/features/regions/store';
import { filterRegions } from '@/features/regions/utils';
import { mockRegions } from '@/features/regions/mock-data';
import { KPICards } from '@/features/regions/components/kpi-cards';
import { RegionToolbar } from '@/features/regions/components/region-toolbar';
import { RegionAccordion } from '@/features/regions/components/region-accordion';
import { AnalyticsPanel } from '@/features/regions/components/analytics-panel';
import { WilayaDrawer } from '@/features/regions/components/wilaya-drawer';
import { CreateRegionDialog } from '@/features/regions/components/create-region-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RegionsLoadingSkeleton } from '@/features/regions/components/loading-skeleton';
import { RegionsEmptyState, RegionsErrorState } from '@/features/regions/components/error-states';
import { regionsService, type RegionsAnalyticsResponse } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { Plus, Download, RefreshCw, Calendar, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RegionsPage() {
  const { filters, selectedWilaya, setSelectedWilaya } = useRegionsStore();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [analytics, setAnalytics] = useState<RegionsAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog State for Create / Customize Region
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<RegionData | null>(null);

  const fetchRegionsFromBackend = useCallback(async () => {
    try {
      setHasError(false);
      const [listRes, analyticsRes] = await Promise.allSettled([
        regionsService.list(),
        regionsService.getAnalytics(),
      ]);

      if (listRes.status === 'fulfilled') {
        setRegions(listRes.value.data || []);
      } else {
        setRegions([]);
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
      }
    } catch {
      setRegions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
    fetchRegionsFromBackend();
  }, [fetchRegionsFromBackend]);

  const filteredRegions = useMemo(() => filterRegions(regions, filters), [regions, filters]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRegionsFromBackend().then(() => {
      toast.success('Regions refreshed from backend');
    });
  }, [fetchRegionsFromBackend]);

  const handleOpenCreate = () => {
    setEditingRegion(null);
    setCreateDialogOpen(true);
  };

  const handleOpenCustomize = (region: RegionData) => {
    setEditingRegion(region);
    setCreateDialogOpen(true);
  };

  // Dialog State for Delete Region Confirmation
  const [regionToDelete, setRegionToDelete] = useState<RegionData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDelete = (region: RegionData) => {
    setRegionToDelete(region);
  };

  const handleConfirmDelete = async () => {
    if (!regionToDelete) return;
    setIsDeleting(true);
    try {
      await regionsService.delete(regionToDelete.dbId || regionToDelete.id);
      toast.success(`Region "${regionToDelete.name}" deleted successfully!`);
      setRegionToDelete(null);
      await fetchRegionsFromBackend();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete region';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) return null;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Regions Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage Algeria&apos;s geographical distribution network</p>
          </div>
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
        <RegionsErrorState onRetry={handleRefresh} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Regions Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage Algeria&apos;s geographical distribution network</p>
          </div>
        </div>
        <RegionsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Regions Page */}
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
                <BreadcrumbLink href="/regions" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  regions
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Regions Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage Algeria&apos;s geographical distribution network, customize commercial delegates, and 58 wilayas.
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

          {/* New Region Primary Button */}
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
            <span>New Region</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards regions={regions} />

      {/* Region Toolbar & Filter */}
      <RegionToolbar />

      {/* Region Accordion or Empty State */}
      <div className="w-full">
        {filteredRegions.length === 0 ? (
          <RegionsEmptyState onCreateRegion={handleOpenCreate} />
        ) : (
          <RegionAccordion
            regions={filteredRegions}
            onEditRegion={handleOpenCustomize}
            onDeleteRegion={handleOpenDelete}
          />
        )}
      </div>

      {/* Bottom Section: Operations & Regional Summary (3 Column Grid Full Width) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Regional Performance & Territory Summary</h2>
        <AnalyticsPanel analytics={analytics} />
      </div>

      {/* Wilaya Drawer */}
      {selectedWilaya && (
        <WilayaDrawer wilayaId={selectedWilaya} onClose={() => setSelectedWilaya(null)} />
      )}

      {/* Create / Customize Region Dialog */}
      <CreateRegionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        regionToEdit={editingRegion}
        onSaved={() => {
          fetchRegionsFromBackend();
        }}
        onDelete={handleOpenDelete}
      />

      {/* Delete Region Confirmation Dialog */}
      <Dialog open={Boolean(regionToDelete)} onOpenChange={(open) => !open && setRegionToDelete(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-md rounded-2xl p-6 bg-card text-card-foreground shadow-xl border border-border/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Delete Region
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This action will permanently delete the region.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 text-xs text-muted-foreground space-y-3">
            <p>
              Are you sure you want to delete <strong className="text-foreground">{regionToDelete?.name}</strong>?
            </p>
            <div className="text-[11px] text-muted-foreground/90 bg-muted/40 p-3 rounded-xl border border-border/40 space-y-1">
              <p className="font-semibold text-foreground">What happens next?</p>
              <p>• The {regionToDelete?.wilayas.length || 0} wilayas assigned to this region will become unassigned.</p>
              <p>• Commercial delegates assigned to this region will no longer have a region assigned.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/30">
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setRegionToDelete(null)}
                className="rounded-xl h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="gap-1.5 rounded-xl h-9 px-4 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete Region</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
