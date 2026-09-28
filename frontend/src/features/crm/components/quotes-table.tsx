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
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Printer,
  ShoppingCart,
  Edit,
  Trash2,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
} from 'lucide-react';
import { crmQuotesService } from '@/services/crm-quotes';
import type { CrmQuote, QuoteStatus } from '@/types/crm-quotes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QuotesTableProps {
  region?: string;
  userId?: number;
  clientId?: number;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground border-border' },
  sent: { label: 'Envoyé', color: 'bg-sky-500/10 text-sky-600 border-sky-200/50' },
  accepted: { label: 'Accepté', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' },
  rejected: { label: 'Refusé', color: 'bg-rose-500/10 text-rose-600 border-rose-200/50' },
  converted: { label: 'Converti en Commande', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50 font-bold' },
  expired: { label: 'Expiré', color: 'bg-amber-500/10 text-amber-600 border-amber-200/50' },
};

export function QuotesTable({ region, userId, clientId }: QuotesTableProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<CrmQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchQuotes = useCallback(() => {
    setLoading(true);
    crmQuotesService
      .list({
        page,
        per_page: 15,
        region: region && region !== 'all' ? region : undefined,
        user_id: userId,
        client_id: clientId,
        status: statusFilter !== 'all' ? (statusFilter as QuoteStatus) : undefined,
        search: search.trim() || undefined,
      })
      .then((res) => {
        setQuotes(res.data || []);
        setTotalPages(res.last_page || 1);
        setTotalQuotes(res.total || 0);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des devis.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, region, userId, clientId, statusFilter, search]);

  useEffect(() => {
    fetchQuotes();
    window.addEventListener('sti-crm-quote-updated', fetchQuotes);
    return () => {
      window.removeEventListener('sti-crm-quote-updated', fetchQuotes);
    };
  }, [fetchQuotes]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement ce devis ?')) return;
    try {
      await crmQuotesService.delete(id);
      toast.success('Devis supprimé avec succès.');
      fetchQuotes();
      window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const handleConvertToOrder = async (quote: CrmQuote) => {
    if (!confirm(`Convertir le devis ${quote.quote_code} en commande ?`)) return;
    try {
      await crmQuotesService.convertToOrder(quote.id);
      toast.success('Devis converti en commande ! 🎉');
      fetchQuotes();
      window.dispatchEvent(new CustomEvent('sti-crm-quote-updated'));
      router.push('/orders');
    } catch {
      toast.error('Erreur lors de la conversion.');
    }
  };

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full bg-card">
        {/* Integrated Combined Header & Filters */}
        <CardHeader className="pb-3 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Liste des Devis & Proformas</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                    {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    <span>{totalQuotes} Devis</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Émission d'offres commerciales, suivi des validations et conversion en commandes
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => router.push(clientId ? `/crm/quotes/new?clientId=${clientId}` : '/crm/quotes/new')}
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>Nouveau devis</span>
            </Button>
          </div>

          {/* Integrated Filter Row */}
          <div className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher n° devis, client..."
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
                <SelectTrigger className="h-8 text-xs rounded-xl w-[160px] bg-background border-border/70">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Tous statuts</SelectItem>
                  <SelectItem value="draft" className="text-xs">Brouillon</SelectItem>
                  <SelectItem value="sent" className="text-xs">Envoyé</SelectItem>
                  <SelectItem value="accepted" className="text-xs">Accepté</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Refusé</SelectItem>
                  <SelectItem value="converted" className="text-xs">Converti en commande</SelectItem>
                  <SelectItem value="expired" className="text-xs">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-xs font-bold py-3">Réf. Devis</TableHead>
              <TableHead className="text-xs font-bold py-3">Destinataire</TableHead>
              <TableHead className="text-xs font-bold py-3">Dates (Émission / Validité)</TableHead>
              <TableHead className="text-xs font-bold py-3">Affaire liée</TableHead>
              <TableHead className="text-xs font-bold py-3">Montant TTC</TableHead>
              <TableHead className="text-xs font-bold py-3">Statut</TableHead>
              <TableHead className="text-xs font-bold py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Chargement des devis...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs">
                    <FileText className="h-8 w-8 text-muted-foreground/40 mb-1" />
                    <span className="font-semibold text-foreground">Aucun devis trouvé</span>
                    <span>Créez votre première proposition commerciale ou proforma.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((q) => {
                const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                return (
                  <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                    {/* Réf. Devis */}
                    <TableCell className="py-3">
                      <span
                        onClick={() => router.push(`/crm/quotes/${q.id}`)}
                        className="font-mono font-bold text-xs text-primary hover:underline cursor-pointer block"
                      >
                        {q.quote_code}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {q.items?.length || 0} article(s)
                      </span>
                    </TableCell>

                    {/* Destinataire */}
                    <TableCell className="py-3 text-xs">
                      <span className="font-bold text-foreground block">{q.client_name}</span>
                      <span className="text-[11px] text-muted-foreground block">
                        {q.wilaya ? `${q.wilaya}, ` : ''}{q.region}
                      </span>
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="py-3 text-xs">
                      <span className="text-foreground block font-medium">{q.issue_date}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Jusqu'au {q.valid_until || '30j'}
                      </span>
                    </TableCell>

                    {/* Affaire / Opportunité */}
                    <TableCell className="py-3 text-xs">
                      {q.opportunity ? (
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                          <Layers className="h-3 w-3" />
                          <span className="truncate max-w-[130px]">{q.opportunity.title}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-[11px]">-</span>
                      )}
                    </TableCell>

                    {/* Montant TTC */}
                    <TableCell className="py-3 text-xs font-black font-mono text-foreground">
                      {formatDzd(q.total_ttc)}
                    </TableCell>

                    {/* Statut */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className={`text-[11px] rounded-lg ${statusCfg.color}`}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/crm/quotes/${q.id}`)}
                          className="h-7 px-2 text-[11px] font-semibold rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Proforma</span>
                        </Button>

                        {q.status !== 'converted' && q.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToOrder(q)}
                            className="h-7 px-2 text-[11px] font-semibold rounded-lg gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            title="Convertir en commande"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span className="hidden sm:inline">Commander</span>
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
                              onClick={() => router.push(`/crm/quotes/${q.id}`)}
                              className="gap-2 cursor-pointer font-semibold"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Consulter / Imprimer</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => router.push(`/crm/quotes/new?quoteId=${q.id}`)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Modifier</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(q.id)}
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
              Affichage de {quotes.length} sur {totalQuotes} devis
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
    </div>
  );
}
