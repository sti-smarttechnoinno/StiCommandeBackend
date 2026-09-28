'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Search,
  Plus,
  MoreVertical,
  UserCheck,
  UserPlus,
  Target,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { crmLeadsService } from '@/services/crm-pipeline';
import type { CrmLead, LeadStatus, LeadSource } from '@/types/crm-pipeline';
import { CreateLeadDialog } from './create-lead-dialog';
import { ConvertLeadDialog } from './convert-lead-dialog';
import { OpportunityDialog } from './opportunity-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface LeadsTableProps {
  region?: string;
  userId?: number;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Nouveau', color: 'bg-sky-500/10 text-sky-600 border-sky-200/50' },
  contacted: { label: 'Contacté', color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
  qualified: { label: 'Qualifié', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50' },
  converted: { label: 'Converti en Client', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50 font-bold' },
  lost: { label: 'Non retenu', color: 'bg-muted text-muted-foreground border-border' },
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  field_prospection: 'Terrain',
  inbound_call: 'Appel entrant',
  recommendation: 'Recommandation',
  event: 'Événement',
  other: 'Autre',
};

export function LeadsTable({ region, userId }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<CrmLead | null>(null);

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<CrmLead | null>(null);

  const [oppDialogOpen, setOppDialogOpen] = useState(false);
  const [leadForOpp, setLeadForOpp] = useState<CrmLead | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    crmLeadsService
      .list({
        page,
        per_page: 15,
        region: region && region !== 'all' ? region : undefined,
        user_id: userId,
        status: statusFilter !== 'all' ? (statusFilter as LeadStatus) : undefined,
        source: sourceFilter !== 'all' ? (sourceFilter as LeadSource) : undefined,
        search: search.trim() || undefined,
      })
      .then((res) => {
        setLeads(res.data || []);
        setTotalPages(res.last_page || 1);
        setTotalLeads(res.total || 0);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des prospects.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, region, userId, statusFilter, sourceFilter, search]);

  useEffect(() => {
    fetchLeads();
    window.addEventListener('sti-crm-lead-updated', fetchLeads);
    return () => {
      window.removeEventListener('sti-crm-lead-updated', fetchLeads);
    };
  }, [fetchLeads]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement ce prospect ?')) return;
    try {
      await crmLeadsService.delete(id);
      toast.success('Prospect supprimé.');
      fetchLeads();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const formatDzd = (val?: number | null) => {
    if (!val) return '-';
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full bg-card">
        {/* Integrated Combined Header & Filters */}
        <CardHeader className="pb-3 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Répertoire des Prospects (Leads)</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                    {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    <span>{totalLeads} Prospects</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Recherchez, qualifiez et suivez la maturation commerciale de vos prospects
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setLeadToEdit(null);
                setCreateDialogOpen(true);
              }}
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>Nouveau prospect</span>
            </Button>
          </div>

          {/* Integrated Filter Row */}
          <div className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher société, contact, tél..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-8 text-xs rounded-xl bg-background border-border/70"
                />
              </div>

              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl w-[140px] bg-background border-border/70">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Tous statuts</SelectItem>
                  <SelectItem value="new" className="text-xs">Nouveau</SelectItem>
                  <SelectItem value="contacted" className="text-xs">Contacté</SelectItem>
                  <SelectItem value="qualified" className="text-xs">Qualifié</SelectItem>
                  <SelectItem value="converted" className="text-xs">Converti</SelectItem>
                  <SelectItem value="lost" className="text-xs">Non retenu</SelectItem>
                </SelectContent>
              </Select>

              {/* Source filter */}
              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v || 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl w-[140px] bg-background border-border/70">
                  <SelectValue placeholder="Origine" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Toutes origines</SelectItem>
                  <SelectItem value="field_prospection" className="text-xs">Terrain</SelectItem>
                  <SelectItem value="inbound_call" className="text-xs">Appel entrant</SelectItem>
                  <SelectItem value="recommendation" className="text-xs">Recommandation</SelectItem>
                  <SelectItem value="event" className="text-xs">Événement</SelectItem>
                  <SelectItem value="other" className="text-xs">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs font-bold py-3">Établissement / Contact</TableHead>
              <TableHead className="text-xs font-bold py-3">Localisation</TableHead>
              <TableHead className="text-xs font-bold py-3">Origine</TableHead>
              <TableHead className="text-xs font-bold py-3">Statut</TableHead>
              <TableHead className="text-xs font-bold py-3">Budget estimé</TableHead>
              <TableHead className="text-xs font-bold py-3">Commercial</TableHead>
              <TableHead className="text-xs font-bold py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Chargement des prospects...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Building2 className="h-8 w-8 text-muted-foreground/40 mb-1" />
                    <span className="font-semibold text-foreground">Aucun prospect trouvé</span>
                    <span>Modifiez vos filtres ou enregistrez votre premier prospect.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                    {/* Établissement & Contact */}
                    <TableCell className="py-3">
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          {lead.company_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {lead.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-muted-foreground/70" />
                            {lead.phone}
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground/70" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Localisation */}
                    <TableCell className="py-3 text-xs">
                      <span className="font-semibold text-foreground block">{lead.wilaya}</span>
                      <span className="text-[11px] text-muted-foreground block">{lead.region}</span>
                    </TableCell>

                    {/* Origine */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-medium rounded-lg">
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </Badge>
                    </TableCell>

                    {/* Statut */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className={`text-[11px] rounded-lg ${statusCfg.color}`}>
                        {statusCfg.label}
                      </Badge>
                      {lead.converted_client && (
                        <div
                          onClick={() => router.push(`/clients/${lead.converted_client_id}`)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-primary mt-1 cursor-pointer hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{lead.converted_client.client_code}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Budget */}
                    <TableCell className="py-3 text-xs font-semibold">
                      {formatDzd(lead.estimated_budget)}
                    </TableCell>

                    {/* Commercial */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {lead.user?.name || '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status !== 'converted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLeadToConvert(lead);
                              setConvertDialogOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] font-semibold rounded-lg gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Convertir</span>
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger className="outline-none">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setLeadForOpp(lead);
                                setOppDialogOpen(true);
                              }}
                              className="gap-2 cursor-pointer font-semibold text-primary"
                            >
                              <Target className="h-3.5 w-3.5" />
                              <span>Créer opportunité</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setLeadToEdit(lead);
                                setCreateDialogOpen(true);
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Modifier</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(lead.id)}
                              className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <span>
              Affichage de {leads.length} sur {totalLeads} prospect(s)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 px-2 text-xs rounded-lg"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Précédent
              </Button>
              <span className="font-semibold text-foreground px-2">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 px-2 text-xs rounded-lg"
              >
                Suivant <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        leadToEdit={leadToEdit}
        onSuccess={fetchLeads}
      />

      <ConvertLeadDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        lead={leadToConvert}
        onSuccess={fetchLeads}
      />

      <OpportunityDialog
        open={oppDialogOpen}
        onOpenChange={setOppDialogOpen}
        defaultLeadId={leadForOpp?.id}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
