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
import { Calendar, Download, RefreshCw, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SalesJournalKPICards } from '@/features/sales-journal/components/sales-journal-kpi-cards';
import { SalesJournalFilters } from '@/features/sales-journal/components/sales-journal-filters';
import { SalesJournalTable } from '@/features/sales-journal/components/sales-journal-table';
import { ImportSalesJournalDialog } from '@/features/sales-journal/components/import-sales-journal-dialog';
import {
  salesJournalService,
  SalesJournalRecord,
  SalesJournalKpis,
  SalesJournalFilterOptions,
} from '@/services/sales-journal';

export default function SalesJournalPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [delegate, setDelegate] = useState('all');
  const [wilaya, setWilaya] = useState('all');
  const [paymentMode, setPaymentMode] = useState('all');
  const [depot, setDepot] = useState('all');
  const [matched, setMatched] = useState('all');
  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('operation_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Table Data State
  const [records, setRecords] = useState<SalesJournalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<SalesJournalKpis>({
    totalTtc: 0,
    totalNetHt: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalOperations: 0,
    matchedCount: 0,
    unmatchedCount: 0,
    recoveryRate: 0,
    matchRate: 0,
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<SalesJournalFilterOptions>({
    types: [],
    paymentModes: [],
    depots: [],
    statuses: [],
    wilayas: [],
    regions: [],
    delegates: [],
  });

  // Import Dialog State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastImportAt, setLastImportAt] = useState<string | null>(null);

  const fetchSalesJournal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesJournalService.getSalesJournal({
        search: search || undefined,
        delegate_id: delegate !== 'all' ? delegate : undefined,
        wilaya: wilaya !== 'all' ? wilaya : undefined,
        payment_mode: paymentMode !== 'all' ? paymentMode : undefined,
        depot: depot !== 'all' ? depot : undefined,
        matched: matched !== 'all' ? (matched === 'matched' ? 'true' : 'false') : undefined,
        only_remaining: onlyRemaining ? true : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sortBy,
        sortDir,
        page,
        pageSize,
      });

      setRecords(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setKpis(res.kpis);
      if (res.lastImport?.createdAt) {
        setLastImportAt(format(new Date(res.lastImport.createdAt), 'dd/MM/yyyy HH:mm'));
      }
    } catch {
      setRecords([]);
      toast.error('Erreur lors du chargement du journal de vente.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [
    search,
    delegate,
    wilaya,
    paymentMode,
    depot,
    matched,
    onlyRemaining,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    page,
    pageSize,
  ]);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
    salesJournalService
      .getFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Error fetching filter options:', err));
  }, []);

  useEffect(() => {
    fetchSalesJournal();
  }, [fetchSalesJournal, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    toast.success('Données du journal de vente actualisées.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setDelegate('all');
    setWilaya('all');
    setPaymentMode('all');
    setDepot('all');
    setMatched('all');
    setOnlyRemaining(false);
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error('Aucune vente à exporter.');
      return;
    }

    salesJournalService.exportCsv({
      search: search || undefined,
      delegate_id: delegate !== 'all' ? delegate : undefined,
      wilaya: wilaya !== 'all' ? wilaya : undefined,
      payment_mode: paymentMode !== 'all' ? paymentMode : undefined,
      depot: depot !== 'all' ? depot : undefined,
      matched: matched !== 'all' ? (matched === 'matched' ? 'true' : 'false') : undefined,
      only_remaining: onlyRemaining ? true : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sortBy,
      sortDir,
    });
    toast.success('Export CSV téléchargé.');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Page Header matching DeliveryNotes layout */}
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
                  Vente
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/sales-journal" className="text-foreground text-xs font-semibold capitalize">
                  Journal de Vente
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Journal de Vente
            </h1>
            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5">
              <FileSpreadsheet className="h-3 w-3" />
              <span>Ventes ERP</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Suivi et réconciliation des opérations de vente issues de l&apos;ERP externe avec les données STI.
          </p>
        </div>

        {/* Action Toolbar matching DeliveryNotes buttons */}
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
            <RefreshCw className={cn('h-3.5 w-3.5 text-amber-500 transition-transform duration-700', isRefreshing && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>

          {/* Primary Action: Import ERP File */}
          <Button
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Importer Fichier ERP</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards in DeliveryNotes 6-grid style */}
      <SalesJournalKPICards kpis={kpis} loading={loading} />

      {/* Sales Journal Table with Integrated Filters Header matching DeliveryNotes */}
      <SalesJournalTable
        records={records}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        filtersElement={
          <SalesJournalFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            delegate={delegate}
            onDelegateChange={(val) => {
              setDelegate(val);
              setPage(1);
            }}
            wilaya={wilaya}
            onWilayaChange={(val) => {
              setWilaya(val);
              setPage(1);
            }}
            paymentMode={paymentMode}
            onPaymentModeChange={(val) => {
              setPaymentMode(val);
              setPage(1);
            }}
            depot={depot}
            onDepotChange={(val) => {
              setDepot(val);
              setPage(1);
            }}
            matched={matched}
            onMatchedChange={(val) => {
              setMatched(val);
              setPage(1);
            }}
            onlyRemaining={onlyRemaining}
            onOnlyRemainingChange={(val) => {
              setOnlyRemaining(val);
              setPage(1);
            }}
            dateFrom={dateFrom}
            onDateFromChange={(val) => {
              setDateFrom(val);
              setPage(1);
            }}
            dateTo={dateTo}
            onDateToChange={(val) => {
              setDateTo(val);
              setPage(1);
            }}
            onReset={handleResetFilters}
            filterOptions={filterOptions}
          />
        }
      />

      {/* Import Modal */}
      <ImportSalesJournalDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleRefresh}
        lastImportAt={lastImportAt}
      />
    </div>
  );
}
