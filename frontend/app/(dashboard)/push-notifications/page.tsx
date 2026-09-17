'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  Send,
  Smartphone,
  CheckCircle2,
  Users,
  Search,
  Plus,
  RefreshCw,
  Globe,
  Radio,
  Eye,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  X,
  Megaphone,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Loader2,
  MapPin,
  User,
  Zap,
  Wifi,
  Battery,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkline } from '@/components/charts/sparkline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  notificationsService,
  type SentBroadcastData,
  type SentBroadcastsKPIs,
} from '@/services/notifications';
import api from '@/services/api';

const ICON_THEMES = {
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
} as const;

const DIRECTION_OPTIONS = [
  { value: 'all', label: 'Toutes directions' },
  { value: 'sent_to_delegate', label: 'Push Sortant' },
  { value: 'received_from_system', label: 'Alertes Entrantes' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Toute audience' },
  { value: 'all_delegates', label: 'Tous Délégués' },
  { value: 'region', label: 'Par Région' },
  { value: 'delegate', label: 'Individuel' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'system', label: 'Système' },
  { value: 'objective', label: 'Objectifs' },
  { value: 'orders', label: 'Commandes' },
  { value: 'promotions', label: 'Promotions' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Toute priorité' },
  { value: 'critical', label: 'Critique' },
  { value: 'high', label: 'Haute' },
  { value: 'normal', label: 'Normale' },
  { value: 'low', label: 'Basse' },
];

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onSelect, onClear }: FilterDropdownProps) {
  const isSelected = selected !== 'all' && selected !== '';
  const currentLabel = isSelected ? options.find((o) => o.value === selected)?.label || selected : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none" nativeButton={false}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
            isSelected
              ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
          )}
        >
          <span>{currentLabel}</span>
          {isSelected && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
              1
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isSelected && (
            <>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={onClear}
                className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                onSelect={(e) => e.preventDefault()}
              >
                Clear all
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected === opt.value}
              onCheckedChange={() => onSelect(opt.value)}
              className="rounded-lg cursor-pointer text-xs"
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(target);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const duration = 1000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return <span>{prefix}{display.toLocaleString('en-US')}{suffix}</span>;
}

export default function PushNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<SentBroadcastData[]>([]);
  const [kpis, setKpis] = useState<SentBroadcastsKPIs>({
    totalSent: 0,
    totalReached: 0,
    avgDeliveryRate: 100,
    activeDevices: 0,
    registeredDelegates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Create broadcast modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'region' | 'delegate'>('all');
  const [targetId, setTargetId] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('high');
  const [category, setCategory] = useState('system');

  // Dynamic dropdown data
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  const [delegates, setDelegates] = useState<Array<{ id: string; name: string; region?: string }>>([]);

  // Details drawer
  const [selectedBroadcast, setSelectedBroadcast] = useState<SentBroadcastData | null>(null);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
    fetchBroadcasts();

    api.get<{ data: Array<{ id: string | number; name: string }> }>('/regions', { params: { pageSize: 100 } })
      .then((res) => {
        const raw = res.data?.data || [];
        setRegions(raw.map((r) => ({ id: String(r.id), name: r.name })));
      })
      .catch(() => {});

    api.get<{ data: Array<{ id: string | number; name: string; region?: string }> }>('/delegates', { params: { pageSize: 200 } })
      .then((res) => {
        const raw = res.data?.data || [];
        setDelegates(raw.map((d) => ({
          id: String(d.id),
          name: d.name,
          region: d.region,
        })));
      })
      .catch(() => {});
  }, []);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await notificationsService.getSentBroadcasts();
      setBroadcasts(res.data || []);
      setKpis(res.kpis);
    } catch {
      toast.error('Erreur lors du chargement des notifications diffusées');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBroadcasts();
    toast.info('Actualisation des diffusions...');
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Veuillez remplir le titre et le message de la notification');
      return;
    }

    setIsSending(true);
    try {
      await notificationsService.sendBroadcast({
        title,
        body,
        target_type: targetType,
        target_id: targetId || undefined,
        category,
        priority,
      });

      toast.success('Notification push diffusée avec succès sur les téléphones !');
      setCreateModalOpen(false);
      setTitle('');
      setBody('');
      setTargetType('all');
      setTargetId('');
      fetchBroadcasts();
    } catch {
      toast.error("Échec lors de l'envoi du push broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterDirection('all');
    setFilterAudience('all');
    setFilterCategory('all');
    setFilterPriority('all');
    setPage(1);
  };

  const hasFilters =
    searchQuery ||
    filterDirection !== 'all' ||
    filterAudience !== 'all' ||
    filterCategory !== 'all' ||
    filterPriority !== 'all';

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (filterDirection !== 'all' ? 1 : 0) +
    (filterAudience !== 'all' ? 1 : 0) +
    (filterCategory !== 'all' ? 1 : 0) +
    (filterPriority !== 'all' ? 1 : 0);

  // Filtered broadcast list
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetAudience.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.referenceId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDirection =
        filterDirection === 'all' || item.direction === filterDirection;

      const matchesAudience =
        filterAudience === 'all' || item.targetType === filterAudience;

      const matchesCategory =
        filterCategory === 'all' || item.category === filterCategory;

      const matchesPriority =
        filterPriority === 'all' || item.priority === filterPriority;

      return matchesSearch && matchesDirection && matchesAudience && matchesCategory && matchesPriority;
    });
  }, [broadcasts, searchQuery, filterDirection, filterAudience, filterCategory, filterPriority]);

  const totalPages = Math.max(1, Math.ceil(filteredBroadcasts.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBroadcasts.slice(start, start + pageSize);
  }, [filteredBroadcasts, page, pageSize]);

  const sentCount = broadcasts.filter((b) => b.direction === 'sent_to_delegate').length;
  const receivedCount = broadcasts.filter((b) => b.direction === 'received_from_system').length;

  const kpiCards = [
    {
      title: 'Total Diffusions',
      value: kpis.totalSent,
      changeLabel: 'Alertes & Objectifs',
      icon: <Radio className="h-5 w-5" />,
      iconColor: 'red' as const,
      sparkline: [4, 6, 8, 12, 15, kpis.totalSent],
      sparkColor: '#D71920',
    },
    {
      title: 'Envoyées aux Délégués',
      value: sentCount,
      changeLabel: 'Push mobiles sortants',
      icon: <Send className="h-5 w-5" />,
      iconColor: 'blue' as const,
      sparkline: [2, 4, 7, 9, 11, sentCount],
      sparkColor: '#2563EB',
    },
    {
      title: 'Taux de Délivrabilité',
      value: `${kpis.avgDeliveryRate}%`,
      changeLabel: 'Délivrabilité FCM',
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconColor: 'green' as const,
      sparkline: [95, 97, 98, 99, 100, kpis.avgDeliveryRate],
      sparkColor: '#22C55E',
    },
    {
      title: 'Appareils Actifs',
      value: `${kpis.activeDevices} / ${kpis.registeredDelegates}`,
      changeLabel: 'Délégués Connectés',
      icon: <Smartphone className="h-5 w-5" />,
      iconColor: 'amber' as const,
      sparkline: [1, 2, 2, 3, 3, kpis.activeDevices],
      sparkColor: '#F59E0B',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header matching /notifications header */}
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
                <BreadcrumbLink href="/push-notifications" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  push broadcasts
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Push Broadcasts & Device Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi des diffusions push vers les téléphones des délégués et journal de réception des appareils.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exportation du journal des diffusions...')}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Nouvelle Diffusion Push</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards matching /delegates style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="p-4 flex items-center justify-center h-28 border-border/40 bg-card"
              >
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </Card>
            ))
          : kpiCards.map((kpi) => (
              <Card
                key={kpi.title}
                className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                      {kpi.title}
                    </span>
                    <div className="text-xl font-bold tracking-tight text-foreground">
                      {typeof kpi.value === 'number' ? <CountUp target={kpi.value} /> : kpi.value}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                      ICON_THEMES[kpi.iconColor]
                    )}
                  >
                    {kpi.icon}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {kpi.changeLabel}
                    </span>
                  </div>
                  {kpi.sparkline && kpi.sparkline.length > 0 && (
                    <div className="w-14 h-6">
                      <Sparkline data={kpi.sparkline} color={kpi.sparkColor || '#2563EB'} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
      </div>

      {/* Main Full Width Table with Integrated Header & Filters matching /orders style */}
      <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
        <CardHeader className="pb-3 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Radio className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Journal des Diffusions Push & Alertes</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                    {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    <span>{filteredBroadcasts.length} Diffusions</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Suivi des diffusions push vers les téléphones des délégués et journal de réception des appareils
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Integrated Filter Component matching /orders */}
          <div className="pt-2 border-t border-border/30 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher par titre, contenu, cible..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Direction Filter */}
              <FilterDropdown
                label="Direction"
                options={DIRECTION_OPTIONS}
                selected={filterDirection}
                onSelect={(v) => {
                  setFilterDirection(v);
                  setPage(1);
                }}
                onClear={() => {
                  setFilterDirection('all');
                  setPage(1);
                }}
              />

              {/* Audience Filter */}
              <FilterDropdown
                label="Audience"
                options={AUDIENCE_OPTIONS}
                selected={filterAudience}
                onSelect={(v) => {
                  setFilterAudience(v);
                  setPage(1);
                }}
                onClear={() => {
                  setFilterAudience('all');
                  setPage(1);
                }}
              />

              {/* Category Filter */}
              <FilterDropdown
                label="Catégorie"
                options={CATEGORY_OPTIONS}
                selected={filterCategory}
                onSelect={(v) => {
                  setFilterCategory(v);
                  setPage(1);
                }}
                onClear={() => {
                  setFilterCategory('all');
                  setPage(1);
                }}
              />

              {/* Priority Filter */}
              <FilterDropdown
                label="Priorité"
                options={PRIORITY_OPTIONS}
                selected={filterPriority}
                onSelect={(v) => {
                  setFilterPriority(v);
                  setPage(1);
                }}
                onClear={() => {
                  setFilterPriority('all');
                  setPage(1);
                }}
              />

              {/* Reset Filters */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Effacer ({activeFilterCount})</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr className="bg-muted/30 border-b border-border/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <TableHead className="py-3 px-4 w-[160px]">Direction / Type</TableHead>
                  <TableHead className="py-3 px-4 min-w-[260px]">Notification & Contenu</TableHead>
                  <TableHead className="py-3 px-4 w-[180px]">Cible / Source</TableHead>
                  <TableHead className="py-3 px-4 w-[180px]">Appareils Reçus</TableHead>
                  <TableHead className="py-3 px-4 w-[140px]">Date d'envoi</TableHead>
                  <TableHead className="py-3 px-4 text-right w-[80px]">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5 py-8">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">Chargement du journal des diffusions...</p>
                          <p className="text-[11px] text-muted-foreground">Synchronisation des alertes push et des réceptions mobiles</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center py-8 space-y-2">
                        <Radio className="h-7 w-7 text-muted-foreground/40" />
                        <p className="text-xs font-semibold text-foreground">Aucune diffusion trouvée</p>
                        <p className="text-[11px] text-muted-foreground">Aucun enregistrement ne correspond aux filtres sélectionnés.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const isSent = item.direction === 'sent_to_delegate';

                    return (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedBroadcast(item)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer border-b border-border/30"
                      >
                        {/* Direction Badge */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          {isSent ? (
                            <Badge
                              variant="ghost"
                              className="gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            >
                              <Send className="h-3 w-3" />
                              Diffusé Délégué
                            </Badge>
                          ) : (
                            <Badge
                              variant="ghost"
                              className="gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            >
                              <Inbox className="h-3 w-3" />
                              Reçu par Admin
                            </Badge>
                          )}
                        </TableCell>

                        {/* Title & Body Content */}
                        <TableCell className="py-3.5 px-4">
                          <div className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <span>{item.title}</span>
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px] line-clamp-1 mt-0.5 leading-relaxed">
                            {item.body}
                          </p>
                        </TableCell>

                        {/* Target Audience / Delegate Name */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                            {isSent ? (
                              <Globe className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[150px]">{item.targetAudience}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            Réf: {item.referenceId}
                          </span>
                        </TableCell>

                        {/* Device Reception */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          {isSent ? (
                            <div className="space-y-1 min-w-[130px]">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-foreground">
                                  {item.receivedDevices} / {item.targetDevices} appareils
                                </span>
                                <span className="text-blue-600">{item.deliveryRate}%</span>
                              </div>
                              <Progress
                                value={item.deliveryRate}
                                className="h-1.5 bg-muted rounded-full"
                              />
                            </div>
                          ) : (
                            <span className="text-[10.5px] font-medium text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                              Alerte Système
                            </span>
                          )}
                        </TableCell>

                        {/* Sent Date */}
                        <TableCell className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-foreground text-xs">{item.exactDate}</div>
                          <div className="text-[10.5px] text-muted-foreground">{item.dateFormatted}</div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBroadcast(item)}
                            className="h-8 px-2 rounded-lg text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              </Table>

              {/* Pagination Controls matching notifications-table */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 text-xs text-muted-foreground">
                <span>
                  Affichage de {Math.min((page - 1) * pageSize + 1, filteredBroadcasts.length)} à{' '}
                  {Math.min(page * pageSize, filteredBroadcasts.length)} sur {filteredBroadcasts.length} diffusions
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-2.5 text-xs rounded-lg"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Précédent</span>
                  </Button>
                  <span className="px-2 font-semibold text-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 px-2.5 text-xs rounded-lg"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Send Broadcast Modal Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[28px] p-0 overflow-hidden border-border/70 shadow-2xl bg-card max-h-[92vh] flex flex-col">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-6 py-5 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card"></span>
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                    Diffuser une Notification Push
                    <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-primary/10 text-primary border-primary/20 rounded-full">
                      FCM HTTP v1
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Envoi instantané direct vers les appareils mobiles Android & iOS des délégués.
                  </DialogDescription>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Canal Push Haute Priorité Actif</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Preset Templates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Modèles Rapides (1-Clic)
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '🎯 Objectif Mensuel',
                      t: 'Objectif du Mois Fixé',
                      b: 'Votre objectif de chiffre d’affaires a été fixé. Consultez vos objectifs et suivez votre progression.',
                      c: 'objective',
                      p: 'high',
                    },
                    {
                      label: '🚀 Promotion Spéciale',
                      t: 'Nouvelle Offre Promotionnelle',
                      b: 'Profitez de remises exclusives sur la gamme de produits partenaires dès aujourd’hui.',
                      c: 'marketing',
                      p: 'normal',
                    },
                    {
                      label: '⚡ Alerte Stock',
                      t: 'Mise à jour du Catalogue',
                      b: 'Les stocks et disponibilités des produits viennent d’être réactualisés.',
                      c: 'system',
                      p: 'critical',
                    },
                    {
                      label: '📦 Commande Urgente',
                      t: 'Commande en Attente de Validation',
                      b: 'Une nouvelle commande prioritaire requiert votre confirmation rapide.',
                      c: 'orders',
                      p: 'high',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setTitle(tpl.t);
                        setBody(tpl.b);
                        setCategory(tpl.c);
                        setPriority(tpl.p as any);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border/60 transition-all font-medium flex items-center gap-1 text-foreground"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Titre de la notification *</label>
                    <span className="text-[10px] text-muted-foreground font-mono">{title.length}/65</span>
                  </div>
                  <Input
                    placeholder="Ex: Objectif Mensuel / Promotion Spéciale"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={65}
                    className="text-xs rounded-xl h-10 font-medium focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">Message / Contenu *</label>
                    <span className="text-[10px] text-muted-foreground font-mono">{body.length}/200</span>
                  </div>
                  <Textarea
                    placeholder="Écrivez le message qui apparaîtra sur la bannière et l'écran des délégués..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    required
                    maxLength={200}
                    className="text-xs rounded-xl resize-none font-normal focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              {/* Target Audience Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Audience Ciblée</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'all', label: 'Tous les Délégués', desc: 'Diffusion globale', icon: Globe },
                    { id: 'region', label: 'Par Région', desc: 'Ciblage territorial', icon: MapPin },
                    { id: 'delegate', label: 'Délégué Unique', desc: 'Ciblage individuel', icon: User },
                  ].map((aud) => {
                    const isSelected = targetType === aud.id;
                    const Icon = aud.icon;
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => {
                          setTargetType(aud.id as any);
                          setTargetId('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                            : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary font-bold" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">{aud.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{aud.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region / Delegate selection if applicable */}
              {targetType === 'region' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/60 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Sélectionner la Région *
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {regions.length} région{regions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Select value={targetId} onValueChange={(val) => setTargetId(val || '')} required>
                    <SelectTrigger className="w-full text-xs sm:text-sm rounded-xl h-11 bg-card border-border/80 px-3.5 flex items-center justify-between">
                      <SelectValue placeholder="Choisir une région commerciale..." />
                    </SelectTrigger>
                    <SelectContent className="w-[calc(100vw-3rem)] sm:w-[580px] max-w-full max-h-[300px]">
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.name} className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer w-full">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{r.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetType === 'delegate' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/60 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Sélectionner le Délégué *
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {delegates.length} délégué{delegates.length > 1 ? 's' : ''} disponible{delegates.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Select value={targetId} onValueChange={(val) => setTargetId(val || '')} required>
                    <SelectTrigger className="w-full text-xs sm:text-sm rounded-xl h-11 bg-card border-border/80 px-3.5 flex items-center justify-between">
                      {(() => {
                        const sel = delegates.find((d) => d.id === targetId);
                        if (sel) {
                          return (
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                {sel.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                                {sel.name}
                              </span>
                              {sel.region && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted text-muted-foreground rounded font-medium flex-shrink-0">
                                  {sel.region}
                                </Badge>
                              )}
                            </div>
                          );
                        }
                        return <SelectValue placeholder="Choisir un délégué commercial..." />;
                      })()}
                    </SelectTrigger>
                    <SelectContent className="w-[calc(100vw-3rem)] sm:w-[580px] max-w-full max-h-[300px]">
                      {delegates.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer w-full">
                          <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                {d.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-foreground text-xs sm:text-sm">{d.name}</span>
                            </div>
                            {d.region && (
                              <Badge variant="outline" className="text-[10px] py-0 px-2 bg-muted text-muted-foreground rounded-md font-medium flex-shrink-0">
                                {d.region}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Priorité Push</label>
                  <div className="flex gap-1.5 h-11">
                    {[
                      { id: 'normal', label: 'Normale', color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', active: 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500' },
                      { id: 'high', label: 'Haute ⚡', color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400', active: 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500' },
                      { id: 'critical', label: 'Critique 🔴', color: 'hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400', active: 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id as any)}
                        className={`flex-1 h-full px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                          priority === p.id ? p.active : `border-border/60 bg-card ${p.color}`
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Catégorie</label>
                  <Select value={category} onValueChange={(val) => setCategory(val || 'system')}>
                    <SelectTrigger className="w-full text-xs sm:text-sm rounded-xl h-11 bg-card border-border/80 px-3.5 flex items-center justify-between">
                      {(() => {
                        const cats: Record<string, { label: string; icon: string }> = {
                          system: { label: 'Système & Alerte', icon: '⚡' },
                          objective: { label: 'Objectif Commercial', icon: '🎯' },
                          marketing: { label: 'Promotion & Campagne', icon: '🚀' },
                          orders: { label: 'Commandes & Livraisons', icon: '📦' },
                          general: { label: 'Annonce Générale', icon: '📢' },
                        };
                        const current = cats[category] || cats.system;
                        return (
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none">{current.icon}</span>
                            <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                              {current.label}
                            </span>
                          </div>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent className="w-[calc(100vw-3rem)] sm:w-[320px] max-h-[300px]">
                      <SelectItem value="system" className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">⚡</span>
                          <div>
                            <p className="font-semibold text-foreground">Système & Alerte</p>
                            <p className="text-[10px] text-muted-foreground">Mises à jour et alertes techniques</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="objective" className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🎯</span>
                          <div>
                            <p className="font-semibold text-foreground">Objectif Commercial</p>
                            <p className="text-[10px] text-muted-foreground">Fixation et suivi d’objectifs</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="marketing" className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🚀</span>
                          <div>
                            <p className="font-semibold text-foreground">Promotion & Campagne</p>
                            <p className="text-[10px] text-muted-foreground">Offres et remises exclusives</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="orders" className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">📦</span>
                          <div>
                            <p className="font-semibold text-foreground">Commandes & Livraisons</p>
                            <p className="text-[10px] text-muted-foreground">Suivi et validation de commandes</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="general" className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">📢</span>
                          <div>
                            <p className="font-semibold text-foreground">Annonce Générale</p>
                            <p className="text-[10px] text-muted-foreground">Informations pour les équipes</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reach Estimate Pill */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>
                    Portée estimée:{' '}
                    <strong className="text-foreground font-bold">
                      {targetType === 'all'
                        ? `~${kpis.activeDevices || 12} appareils mobiles`
                        : targetType === 'region'
                        ? `Délégués Région (${targetId || 'Toutes'})`
                        : '1 Délégué assigné'}
                    </strong>
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Temps réel 0ms
                </Badge>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span>Diffusion instantanée Firebase Cloud Messaging</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-xs rounded-xl h-9 px-4 font-semibold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSending || !title.trim() || !body.trim()}
                  className="text-xs rounded-xl h-9 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Diffusion en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Diffuser Instantanément</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Broadcast Details Drawer matching /notifications details drawer */}
      <Sheet open={!!selectedBroadcast} onOpenChange={() => setSelectedBroadcast(null)}>
        <SheetContent className="sm:max-w-md p-6 space-y-6">
          {selectedBroadcast && (
            <>
              <SheetHeader className="text-left space-y-1">
                {selectedBroadcast.direction === 'sent_to_delegate' ? (
                  <Badge
                    variant="ghost"
                    className="w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Diffusé au Délégué
                  </Badge>
                ) : (
                  <Badge
                    variant="ghost"
                    className="w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                  >
                    <Inbox className="h-3.5 w-3.5" />
                    Reçu par l'Admin
                  </Badge>
                )}
                <SheetTitle className="text-lg font-bold pt-2">
                  {selectedBroadcast.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Référence: {selectedBroadcast.referenceId} • {selectedBroadcast.exactDate}
                </SheetDescription>
              </SheetHeader>

              {/* Message Content */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Contenu du Message
                </h4>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-xs text-foreground leading-relaxed">
                  {selectedBroadcast.body}
                </div>
              </div>

              {/* Device Reception Statistics */}
              {selectedBroadcast.direction === 'sent_to_delegate' ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Statistiques de Réception Mobile
                  </h4>
                  <div className="p-4 rounded-xl bg-card border border-border/50 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Appareils ciblés:</span>
                      <span className="text-foreground">{selectedBroadcast.targetDevices} appareils</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Appareils ayant reçu:</span>
                      <span className="text-blue-600 font-bold">{selectedBroadcast.receivedDevices} appareils</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Taux de délivrabilité:</span>
                      <span className="text-primary font-bold">{selectedBroadcast.deliveryRate}%</span>
                    </div>
                    <Progress value={selectedBroadcast.deliveryRate} className="h-2 bg-muted rounded-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Origine de l'Événement
                  </h4>
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1.5">
                    <p className="text-foreground font-semibold">Événement Entrant Reçu par l'Administration</p>
                    <p className="text-muted-foreground text-[11px]">
                      Cette alerte a été générée lors de la soumission d'une commande par un client ou un délégué.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Channels & Target */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Détails & Canaux
                </h4>
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audience / Source:</span>
                    <span className="font-semibold text-foreground">{selectedBroadcast.targetAudience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Canaux:</span>
                    <span className="font-semibold text-foreground">{selectedBroadcast.channels.join(' • ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Émetteur:</span>
                    <span className="font-semibold text-foreground">{selectedBroadcast.sender}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBroadcast(null)}
                  className="w-full text-xs rounded-xl"
                >
                  Fermer
                </Button>
                {selectedBroadcast.direction === 'sent_to_delegate' && (
                  <Button
                    onClick={() => {
                      setTitle(selectedBroadcast.title);
                      setBody(selectedBroadcast.body);
                      setSelectedBroadcast(null);
                      setCreateModalOpen(true);
                    }}
                    className="w-full text-xs rounded-xl font-bold bg-primary text-primary-foreground"
                  >
                    Re-diffuser
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
