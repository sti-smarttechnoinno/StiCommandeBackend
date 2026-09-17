'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImportEncaissementsDialog } from '@/features/clients/components/import-encaissements-dialog';
import {
  encaissementsService,
  EncaissementRecord,
  EncaissementsKpis,
  EncaissementFilterOptions,
} from '@/services/encaissements';
import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  Search,
  RefreshCw,
  Download,
  Printer,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  X,
  TrendingUp,
  TrendingDown,
  Globe,
  PieChart,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
} as const;

export default function EncaissementsPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [records, setRecords] = useState<EncaissementRecord[]>([]);
  const [kpis, setKpis] = useState<EncaissementsKpis>({
    totalCredit: 0,
    totalDebit: 0,
    netBalance: 0,
    totalOperations: 0,
    encaissementsCount: 0,
    decaissementsCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastImportAt, setLastImportAt] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('payment_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<EncaissementFilterOptions>({
    accounts: [],
    paymentModes: [],
    types: ['Encaissement', 'Décaissement'],
  });

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
    encaissementsService
      .getFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Error fetching filter options:', err));
  }, []);

  // Fetch Operations
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await encaissementsService.getEncaissements({
        page,
        pageSize,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search ? search : undefined,
        account: accountFilter !== 'all' ? accountFilter : undefined,
        payment_mode: modeFilter !== 'all' ? modeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sortBy,
        sortDir,
      });

      setRecords(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setKpis(res.kpis);
      if (res.lastImportAt) setLastImportAt(res.lastImportAt);
    } catch (err) {
      console.error('Error fetching encaissements:', err);
      toast.error('Erreur lors du chargement des opérations.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, pageSize, typeFilter, search, accountFilter, modeFilter, dateFrom, dateTo, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    toast.info('Refreshing treasury operations...');
    setTimeout(() => setIsRefreshing(false), 800);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setSearch('');
    setSearchInput('');
    setAccountFilter('all');
    setModeFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters =
    typeFilter !== 'all' ||
    search !== '' ||
    accountFilter !== 'all' ||
    modeFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const formatDZD = (val: number) => {
    return (
      new Intl.NumberFormat('fr-DZ', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val) + ' DZD'
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Page Header / Hero inside Encaissements Page */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard"
                  className="text-muted-foreground text-xs hover:text-foreground transition-colors"
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/clients"
                  className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors"
                >
                  clients
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/encaissements"
                  className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors font-semibold"
                >
                  Journal Trésorerie
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Banknote className="h-7 w-7 text-primary" />
            Journal des Encaissements & Décaissements
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi chronologique exhaustif des encaissements et décaissements ({total.toLocaleString('fr-DZ')} opérations).
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>

          {/* Import Encaissements Dialog */}
          <ImportEncaissementsDialog
            lastImportAt={lastImportAt}
            onSuccess={() => {
              fetchData();
            }}
          />

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting treasury report...')}
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
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 text-amber-500 transition-transform duration-700',
                isRefreshing && 'animate-spin'
              )}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encaissements */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Total Encaissements (Crédit)
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {formatDZD(kpis.totalCredit)}
              </div>
            </div>
            <div
              className={cn(
                'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                ICON_THEMES.green
              )}
            >
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>{kpis.encaissementsCount.toLocaleString('fr-DZ')} opérations</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">Entrées de caisse</span>
          </div>
        </Card>

        {/* Total Décaissements */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Total Décaissements (Débit)
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {formatDZD(kpis.totalDebit)}
              </div>
            </div>
            <div
              className={cn(
                'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                ICON_THEMES.red
              )}
            >
              <ArrowUpRight className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3 w-3" />
              <span>{kpis.decaissementsCount.toLocaleString('fr-DZ')} opérations</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">Sorties de caisse</span>
          </div>
        </Card>

        {/* Solde Net */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Solde Net de Trésorerie
              </span>
              <div
                className={cn(
                  'text-xl font-bold tracking-tight font-mono',
                  kpis.netBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {kpis.netBalance >= 0 ? '+' : ''}
                {formatDZD(kpis.netBalance)}
              </div>
            </div>
            <div
              className={cn(
                'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                kpis.netBalance >= 0 ? ICON_THEMES.green : ICON_THEMES.red
              )}
            >
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                kpis.netBalance >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {kpis.netBalance >= 0 ? 'Excédent' : 'Déficit'}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">Crédit - Débit</span>
          </div>
        </Card>

        {/* Volume d'Opérations */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Volume d'Opérations
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {kpis.totalOperations.toLocaleString('fr-DZ')}
              </div>
            </div>
            <div
              className={cn(
                'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                ICON_THEMES.indigo
              )}
            >
              <Receipt className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-bold text-emerald-600">
                {kpis.totalOperations > 0
                  ? Math.round((kpis.encaissementsCount / kpis.totalOperations) * 100)
                  : 0}
                % enc.
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-bold text-rose-600">
                {kpis.totalOperations > 0
                  ? Math.round((kpis.decaissementsCount / kpis.totalOperations) * 100)
                  : 0}
                % déc.
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">Répartition</span>
          </div>
        </Card>
      </div>

      {/* 3. Full Width Combined Filter & Table Component */}
      <div className="w-full space-y-4">
        <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full">
          {/* Integrated Combined Header & Filters */}
          <CardHeader className="pb-3 border-b border-border/40 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold tracking-tight">
                      Journal des Opérations
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center"
                    >
                      {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                      <span>{total} Opérations</span>
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Recherchez, filtrez et auditez les règlements et mouvements de trésorerie en temps réel
                  </CardDescription>
                </div>
              </div>

              {/* Segmented Type Controls (Pills) */}
              <div className="inline-flex rounded-full bg-muted/60 p-1 border border-border/50 text-muted-foreground">
                <button
                  onClick={() => {
                    setTypeFilter('all');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-full transition-all',
                    typeFilter === 'all'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'hover:text-foreground'
                  )}
                >
                  Tous ({kpis.totalOperations})
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Encaissement');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5',
                    typeFilter === 'Encaissement'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'hover:text-emerald-600'
                  )}
                >
                  <ArrowDownLeft className="h-3 w-3" />
                  <span>Encaissements ({kpis.encaissementsCount})</span>
                </button>
                <button
                  onClick={() => {
                    setTypeFilter('Décaissement');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5',
                    typeFilter === 'Décaissement'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'hover:text-rose-600'
                  )}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Décaissements ({kpis.decaissementsCount})</span>
                </button>
              </div>
            </div>

            {/* Integrated Filter Bar */}
            <div className="pt-3 border-t border-border/30 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Recherche par client, libellé, référence, n° ordre..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs rounded-full border-border/70 bg-card"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>

                {/* Filter Selects Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Compte Select */}
                  <select
                    value={accountFilter}
                    onChange={(e) => {
                      setAccountFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs rounded-full border border-border/70 bg-card px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all">Tous les comptes ({filterOptions.accounts.length})</option>
                    {filterOptions.accounts.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>

                  {/* Mode Select */}
                  <select
                    value={modeFilter}
                    onChange={(e) => {
                      setModeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs rounded-full border border-border/70 bg-card px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all">Tous les modes</option>
                    {filterOptions.paymentModes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Date Du */}
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs rounded-full border-border/70 bg-card w-36 px-3"
                    title="Date Début"
                  />

                  {/* Date Au */}
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 text-xs rounded-full border-border/70 bg-card w-36 px-3"
                    title="Date Fin"
                  />

                  {/* Clear Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-9 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Réinitialiser</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-[140px]">
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors font-bold text-xs"
                      onClick={() => handleSort('payment_date')}
                    >
                      Date & Heure
                      {sortBy === 'payment_date' ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[85px] font-bold text-xs">N° Ordre</TableHead>
                  <TableHead className="w-[110px] font-bold text-xs">Type</TableHead>
                  <TableHead className="min-w-[200px]">
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors font-bold text-xs"
                      onClick={() => handleSort('tiers_name')}
                    >
                      Client / Tiers
                      {sortBy === 'tiers_name' ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[140px] font-bold text-xs">Compte / Caisse</TableHead>
                  <TableHead className="min-w-[180px] font-bold text-xs">Libellé</TableHead>
                  <TableHead className="w-[110px] font-bold text-xs">Mode</TableHead>
                  <TableHead className="w-[130px] font-bold text-xs">Référence</TableHead>
                  <TableHead className="w-[150px] text-right">
                    <button
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors font-bold text-xs"
                      onClick={() => handleSort('amount')}
                    >
                      Montant
                      {sortBy === 'amount' ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[80px] text-center font-bold text-xs">État</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10} className="py-4 px-4">
                        <div className="h-4 bg-muted/60 rounded-md w-full animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
                      <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">Aucune opération trouvée</p>
                      <p className="text-xs mt-1">
                        {hasActiveFilters
                          ? 'Essayez de modifier ou réinitialiser vos critères de recherche.'
                          : 'Importez le fichier Excel pour afficher le journal de trésorerie.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((rec) => {
                    const isEnc = rec.type === 'Encaissement';
                    const mode = rec.payment_mode || '';
                    const modeColor = mode.toLowerCase().includes('esp')
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                      : mode.toLowerCase().includes('vir')
                      ? 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200'
                      : 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200';

                    return (
                      <TableRow
                        key={rec.id}
                        className={cn(
                          'hover:bg-muted/40 transition-colors border-border/40',
                          rec.is_last && 'bg-emerald-500/[0.03]'
                        )}
                      >
                        {/* Date */}
                        <TableCell className="py-3 px-4 whitespace-nowrap text-xs font-medium text-foreground">
                          {formatDate(rec.payment_date)}
                        </TableCell>

                        {/* N° Ordre */}
                        <TableCell className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground font-semibold">
                          {rec.order_number ? `#${rec.order_number}` : '-'}
                        </TableCell>

                        {/* Type Badge */}
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-bold gap-1 px-2 py-0.5 rounded-full',
                              isEnc
                                ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                                : 'border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10'
                            )}
                          >
                            {isEnc ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            <span>{rec.type}</span>
                          </Badge>
                        </TableCell>

                        {/* Client / Tiers */}
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {rec.client ? (
                              <Link
                                href={`/clients/${rec.client.id}`}
                                className="group inline-flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary transition-colors"
                              >
                                <span>{rec.tiers_name || rec.client.name}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                              </Link>
                            ) : (
                              <span className={cn('text-xs font-semibold', !rec.tiers_name && 'italic text-muted-foreground')}>
                                {rec.tiers_name || 'Sans tiers'}
                              </span>
                            )}
                            {rec.is_last && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 font-bold"
                              >
                                Dernier règlement
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Compte */}
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] text-foreground font-semibold border border-border/50">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {rec.account || 'Caisse'}
                          </span>
                        </TableCell>

                        {/* Libellé */}
                        <TableCell className="py-3 px-4 max-w-xs truncate text-xs text-muted-foreground" title={rec.label || ''}>
                          {rec.label || '-'}
                        </TableCell>

                        {/* Mode */}
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', modeColor)}>
                            {rec.payment_mode || 'Espèces'}
                          </span>
                        </TableCell>

                        {/* Référence */}
                        <TableCell className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {rec.reference || '-'}
                        </TableCell>

                        {/* Montant */}
                        <TableCell className="py-3 px-4 text-right whitespace-nowrap font-mono">
                          <span
                            className={cn(
                              'font-bold text-xs tracking-tight',
                              isEnc
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-700 dark:text-rose-400'
                            )}
                          >
                            {isEnc ? '+' : '-'} {formatDZD(Number(rec.amount))}
                          </span>
                        </TableCell>

                        {/* État */}
                        <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {rec.status || 'Payé'}
                            </span>
                            {rec.locked && (
                              <span title="Verrouillé">
                                <Lock className="h-3 w-3 text-amber-500" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/40 bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Affichage de{' '}
              <strong className="text-foreground">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}
              </strong>{' '}
              à{' '}
              <strong className="text-foreground">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              sur <strong className="text-foreground">{total.toLocaleString('fr-DZ')}</strong>{' '}
              opérations
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Lignes :</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-full border border-border/70 bg-card px-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2 font-semibold text-foreground">
                  Page {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Bottom Toolbar (Same as Clients BottomToolbar) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-card border border-border/40 shadow-xs rounded-2xl">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 bg-muted/40 hover:bg-muted/70 text-foreground"
              onClick={() => toast.info('Exporting full treasury operations...')}
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 bg-muted/40 hover:bg-muted/70 text-foreground"
              onClick={() => toast.info('Generating treasury report...')}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Generate Report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 bg-muted/40 hover:bg-muted/70 text-foreground"
              onClick={() => toast.info('Printing treasury journal...')}
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Summary
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {kpis.totalOperations.toLocaleString('fr-DZ')} mouvements enregistrés
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Operations & Analytics Summary (Same as Clients AnalyticsPanel) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Operations & Analytics Summary
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Répartition par Type d'Opération */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <PieChart className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    Flux Trésorerie Global
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Ratio Entrées (Crédit) vs Sorties (Débit)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Encaissements
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatDZD(kpis.totalCredit)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        kpis.totalCredit + kpis.totalDebit > 0
                          ? (kpis.totalCredit / (kpis.totalCredit + kpis.totalDebit)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-600 flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Décaissements
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatDZD(kpis.totalDebit)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        kpis.totalCredit + kpis.totalDebit > 0
                          ? (kpis.totalDebit / (kpis.totalCredit + kpis.totalDebit)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Solde Net Restant</span>
                <span
                  className={cn(
                    'font-mono font-bold text-sm',
                    kpis.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}
                >
                  {kpis.netBalance >= 0 ? '+' : ''}
                  {formatDZD(kpis.netBalance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Modes de Paiement Fréquents */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    Modes de Paiement
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Canaux de règlement utilisés
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {filterOptions.paymentModes.slice(0, 5).map((mode) => (
                <div key={mode} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/80" />
                    {mode}
                  </span>
                  <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0">
                    Actif
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 3: Banques & Caisses Principales */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">
                    Comptes & Caisses
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    {filterOptions.accounts.length} comptes audités
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              {filterOptions.accounts.slice(0, 5).map((acc) => (
                <div
                  key={acc}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-xs"
                >
                  <span className="font-semibold text-foreground truncate max-w-[180px]">
                    {acc}
                  </span>
                  <Badge variant="secondary" className="text-[10px] rounded-full font-mono">
                    Compte Actif
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
