'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  MoreVertical,
  ExternalLink,
  ShoppingCart,
  Trash2,
  Loader2,
  Navigation,
} from 'lucide-react';
import { crmVisitsService } from '@/services/crm';
import type { CrmVisit, VisitStatus, VisitPurpose } from '@/types/crm';
import { CompleteVisitDialog } from './complete-visit-dialog';
import { toast } from 'sonner';

interface VisitsTableProps {
  onOpenCreate: () => void;
  selectedRegion?: string;
  defaultClientId?: number;
}

export function VisitsTable({ onOpenCreate, selectedRegion, defaultClientId }: VisitsTableProps) {
  const router = useRouter();
  const [visits, setVisits] = useState<CrmVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [completingVisit, setCompletingVisit] = useState<CrmVisit | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);

  const loadVisits = () => {
    setLoading(true);
    crmVisitsService
      .list({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        purpose: purposeFilter !== 'all' ? purposeFilter : undefined,
        region: selectedRegion && selectedRegion !== 'all' ? selectedRegion : undefined,
        client_id: defaultClientId,
      })
      .then((res) => {
        setVisits(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      })
      .catch(() => {
        setVisits([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVisits();
  }, [page, statusFilter, purposeFilter, selectedRegion, defaultClientId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadVisits();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleRefresh = () => loadVisits();
    window.addEventListener('sti-crm-visit-created', handleRefresh);
    window.addEventListener('sti-crm-visit-updated', handleRefresh);
    return () => {
      window.removeEventListener('sti-crm-visit-created', handleRefresh);
      window.removeEventListener('sti-crm-visit-updated', handleRefresh);
    };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette visite ?')) return;
    try {
      await crmVisitsService.delete(id);
      toast.success('Visite supprimée avec succès.');
      loadVisits();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const getStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1">
            <CheckCircle2 className="h-3 w-3" /> Réalisée
          </Badge>
        );
      case 'planned':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold gap-1">
            <Clock className="h-3 w-3" /> Planifiée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-muted text-muted-foreground border-border text-xs font-semibold gap-1">
            <XCircle className="h-3 w-3" /> Annulée
          </Badge>
        );
      case 'missed':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs font-semibold gap-1">
            <AlertTriangle className="h-3 w-3" /> Manquée
          </Badge>
        );
    }
  };

  const getPurposeLabel = (purpose: VisitPurpose) => {
    switch (purpose) {
      case 'order_taking':
        return { label: 'Prise de commande', color: 'bg-primary/10 text-primary border-primary/20' };
      case 'prospecting':
        return { label: 'Prospection', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'debt_collection':
        return { label: 'Recouvrement', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'relationship':
        return { label: 'Courtoisie', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };
      case 'claim':
        return { label: 'SAV / Réclamation', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      default:
        return { label: purpose, color: 'bg-muted text-foreground border-border' };
    }
  };

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full bg-card">
      {/* Integrated Combined Header & Filters */}
      <CardHeader className="pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Suivi des Visites Terrain</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{totalCount} Visites</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Historique des passages, motifs d'intervention et géolocalisation en temps réel
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Planifier une visite</span>
          </Button>
        </div>

        {/* Integrated Filter Row */}
        <div className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher client, commercial, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl bg-background border-border/70"
              />
            </div>

            {/* Status Select */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-[140px] bg-background border-border/70">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">Tous les statuts</SelectItem>
                <SelectItem value="planned" className="text-xs">Planifiées</SelectItem>
                <SelectItem value="completed" className="text-xs">Réalisées</SelectItem>
                <SelectItem value="cancelled" className="text-xs">Annulées</SelectItem>
                <SelectItem value="missed" className="text-xs">Manquées</SelectItem>
              </SelectContent>
            </Select>

            {/* Purpose Select */}
            <Select value={purposeFilter} onValueChange={(v) => { setPurposeFilter(v || 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-[160px] bg-background border-border/70">
                <SelectValue placeholder="Motif" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">Tous les motifs</SelectItem>
                <SelectItem value="order_taking" className="text-xs">Prise de commande</SelectItem>
                <SelectItem value="prospecting" className="text-xs">Prospection</SelectItem>
                <SelectItem value="debt_collection" className="text-xs">Recouvrement</SelectItem>
                <SelectItem value="relationship" className="text-xs">Courtoisie</SelectItem>
                <SelectItem value="claim" className="text-xs">SAV / Réclamation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {/* Table Content */}
      <CardContent className="p-0">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Chargement des visites...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Aucune visite trouvée</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Planifiez de nouvelles tournées ou ajustez vos critères de filtrage.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreate}
              className="text-xs rounded-xl gap-1.5 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" /> Planifier maintenant
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Client</TableHead>
                  <TableHead className="text-xs font-bold">Commercial</TableHead>
                  <TableHead className="text-xs font-bold">Date & Heure</TableHead>
                  <TableHead className="text-xs font-bold">Motif</TableHead>
                  <TableHead className="text-xs font-bold">Statut</TableHead>
                  <TableHead className="text-xs font-bold">Check-in GPS</TableHead>
                  <TableHead className="text-xs font-bold">Compte-rendu</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => {
                  const purposeInfo = getPurposeLabel(visit.purpose);
                  const isCompleted = visit.status === 'completed';
                  return (
                    <TableRow key={visit.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                      {/* Client */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span
                            onClick={() => router.push(`/clients/${visit.client_id}`)}
                            className="font-bold text-xs text-foreground hover:text-primary cursor-pointer hover:underline block"
                          >
                            {visit.client?.name || `Client #${visit.client_id}`}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-mono">{visit.client?.client_code}</span>
                            {visit.client?.wilaya && <span>• {visit.client.wilaya}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Commercial */}
                      <TableCell>
                        <span className="text-xs font-medium text-foreground">
                          {visit.user?.name || 'Non assigné'}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground block">
                            {new Date(visit.planned_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {new Date(visit.planned_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>

                      {/* Purpose */}
                      <TableCell>
                        <Badge className={`text-[11px] font-semibold ${purposeInfo.color}`}>
                          {purposeInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(visit.status)}
                      </TableCell>

                      {/* GPS Check-in */}
                      <TableCell>
                        {visit.checkin_latitude && visit.checkin_longitude ? (
                          <div
                            className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit"
                            title={`Lat: ${visit.checkin_latitude}, Lng: ${visit.checkin_longitude}`}
                          >
                            <MapPin className="h-3 w-3" />
                            <span>Certifié</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Summary Notes */}
                      <TableCell className="max-w-[220px]">
                        <p className="text-xs text-muted-foreground truncate" title={visit.summary || undefined}>
                          {visit.summary || (isCompleted ? 'Aucun détail' : 'En attente de réalisation')}
                        </p>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCompleted && visit.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCompletingVisit(visit);
                                setCompleteOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] font-semibold rounded-lg gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            >
                              <Navigation className="h-3 w-3" />
                              <span>Rapport</span>
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl text-xs">
                              <DropdownMenuItem
                                onClick={() => router.push(`/clients/${visit.client_id}`)}
                                className="gap-2 cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Fiche client</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/orders/new?clientId=${visit.client_id}`)}
                                className="gap-2 cursor-pointer font-semibold text-primary"
                              >
                                <ShoppingCart className="h-3.5 w-3.5" />
                                <span>Créer commande</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(visit.id)}
                                className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Supprimer visite</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total : {totalCount} visite(s)</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Précédent
              </Button>
              <span className="font-semibold px-2">Page {page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Complete Visit Modal */}
      <CompleteVisitDialog
        visit={completingVisit}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onSuccess={loadVisits}
      />
    </Card>
  );
}
