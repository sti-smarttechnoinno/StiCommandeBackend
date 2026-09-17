'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, Download, RefreshCw, Truck, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliveryNotesKPICards } from '@/features/delivery-notes/components/delivery-notes-kpi-cards';
import { DeliveryNotesFilters } from '@/features/delivery-notes/components/delivery-notes-filters';
import { DeliveryNotesTable } from '@/features/delivery-notes/components/delivery-notes-table';
import { DeliveryNoteModal } from '@/features/delivery-notes/components/delivery-note-modal';
import { deliveryNotesService } from '@/services/delivery-notes';
import type { DeliveryNoteData } from '@/features/delivery-notes/types';

export default function DeliveryNotesPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [validationType, setValidationType] = useState('all');
  const [page, setPage] = useState(1);

  // Table Data State
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNoteData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedDN, setSelectedDN] = useState<DeliveryNoteData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDeliveryNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryNotesService.list({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        validation_type: validationType !== 'all' ? validationType : undefined,
        page,
        pageSize: 10,
      });

      setDeliveryNotes(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      setDeliveryNotes([]);
      toast.error('Erreur lors du chargement des bons de livraison.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [search, status, validationType, page]);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  useEffect(() => {
    fetchDeliveryNotes();
  }, [fetchDeliveryNotes, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    toast.success('Données des bons de livraison actualisées.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setValidationType('all');
    setPage(1);
  };

  const handleOpenDetail = (dn: DeliveryNoteData) => {
    setSelectedDN(dn);
    setModalOpen(true);
  };

  const handleQuickMarkDelivered = async (dn: DeliveryNoteData) => {
    try {
      await deliveryNotesService.updateStatus(dn.id, 'delivered');
      toast.success(`Bon de livraison ${dn.delivery_note_code} marqué comme livré.`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const handleExportCSV = () => {
    if (deliveryNotes.length === 0) {
      toast.error('Aucun bon de livraison à exporter.');
      return;
    }

    const headers = ['Code BL', 'Commande', 'Client', 'Wilaya', 'Type', 'Tranche', 'Quantite', 'Montant DA', 'Statut', 'Date'];
    const rows = deliveryNotes.map((dn) => [
      dn.delivery_note_code,
      dn.order_code,
      `"${dn.client_name}"`,
      `"${dn.wilaya}"`,
      dn.validation_type,
      dn.batch_number,
      dn.total_quantity,
      dn.total_amount,
      dn.status,
      dn.created_at ? format(new Date(dn.created_at), 'yyyy-MM-dd') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bons_de_livraison_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    toast.success('Export CSV téléchargé.');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
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
                <BreadcrumbLink href="/orders" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Commandes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/delivery-notes" className="text-foreground text-xs font-semibold capitalize">
                  Bons de Livraison
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Bons de Livraison
            </h1>
            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5">
              <Truck className="h-3 w-3" />
              <span>Logistique</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Suivi des expéditions générées automatiquement ou manuellement par tranches ou en direct.
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
            onClick={handleExportCSV}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export CSV</span>
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

          {/* New Delivery Note Primary Button (at the right, matching other pages) */}
          <Link href="/delivery-notes/new">
            <Button
              size="sm"
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>Nouveau Bon de Livraison</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <DeliveryNotesKPICards refreshKey={refreshKey} />

      {/* Delivery Notes Table with Integrated Filters Header matching Orders */}
      <DeliveryNotesTable
        deliveryNotes={deliveryNotes}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onSelectDeliveryNote={handleOpenDetail}
        onQuickMarkDelivered={handleQuickMarkDelivered}
        filtersElement={
          <DeliveryNotesFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            status={status}
            onStatusChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            validationType={validationType}
            onValidationTypeChange={(val) => {
              setValidationType(val);
              setPage(1);
            }}
            onReset={handleResetFilters}
          />
        }
      />

      {/* Detail / Print Modal */}
      <DeliveryNoteModal
        deliveryNote={selectedDN}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}