'use client';

import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Loader2,
  ExternalLink,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';
import type { SalesJournalRecord } from '@/services/sales-journal';

interface SalesJournalTableProps {
  records: SalesJournalRecord[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
  filtersElement?: React.ReactNode;
}

export function SalesJournalTable({
  records,
  loading,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortDir,
  onSort,
  filtersElement,
}: SalesJournalTableProps) {
  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card flex flex-col w-full py-0 gap-0">
      {/* Integrated Combined Header & Filters matching DeliveryNotes */}
      <CardHeader className="pt-5 sm:pt-6 px-5 sm:px-6 pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Liste des Ventes</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{total.toLocaleString()} Ventes</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Rechercher, filtrer et gérer toutes les opérations de vente réconciliées avec le système
              </CardDescription>
            </div>
          </div>
        </div>

        {filtersElement && (
          <div className="pt-2 border-t border-border/30">
            {filtersElement}
          </div>
        )}
      </CardHeader>

      {loading ? (
        <div className="p-12 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-semibold">Chargement des opérations du journal...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Aucune vente trouvée</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Aucun enregistrement ne correspond à vos filtres, ou aucun journal de vente n’a encore été téléversé.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border/60">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap cursor-pointer select-none" onClick={() => onSort('reference')}>
                    <div className="flex items-center gap-1.5">
                      <span>Référence</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap cursor-pointer select-none" onClick={() => onSort('operation_date')}>
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-6 text-xs font-bold text-foreground min-w-[220px] cursor-pointer select-none" onClick={() => onSort('tiers_name')}>
                    <div className="flex items-center gap-1.5">
                      <span>Client</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap">Délégué STI</TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-right whitespace-nowrap cursor-pointer select-none" onClick={() => onSort('total_ttc')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Net TTC (DA)</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-right whitespace-nowrap cursor-pointer select-none" onClick={() => onSort('paid_amount')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Paiement (DA)</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-right whitespace-nowrap cursor-pointer select-none" onClick={() => onSort('remaining_amount')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Reste Dû (DA)</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>

                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-center whitespace-nowrap">Mode / Dépôt</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-center whitespace-nowrap">Statut</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {records.map((r) => {
                  const hasRemaining = r.remaining_amount > 0;
                  const isPaid = r.remaining_amount <= 0 && r.total_ttc > 0;

                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/40 transition-colors border-b border-border/40 group"
                    >
                      {/* Référence */}
                      <TableCell className="py-3.5 px-5 font-bold font-mono text-xs text-primary whitespace-nowrap">
                        {r.reference}
                        <div className="text-[10px] text-muted-foreground font-normal">{r.type}</div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3.5 px-5 text-xs text-muted-foreground whitespace-nowrap">
                        {r.operation_date ? format(new Date(r.operation_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>

                      {/* Client */}
                      <TableCell className="py-3.5 px-6">
                        {r.client ? (
                          <div>
                            <Link
                              href={`/clients/${r.client.id}`}
                              className="font-semibold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1 group/link"
                            >
                              <span className="truncate max-w-[220px]">{r.client.name}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-primary shrink-0" />
                            </Link>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              <span className="font-mono text-[10px] bg-muted/80 px-1 rounded border border-border/50">
                                {r.client.client_code}
                              </span>
                              {(r.wilaya || r.client.wilaya) && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  <span>{r.wilaya || r.client.wilaya}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-xs text-foreground truncate max-w-[220px] block" title={r.tiers_name}>
                              {r.tiers_name}
                            </span>
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 mt-0.5 inline-block">
                              Non réconcilié
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Délégué Commercial STI */}
                      <TableCell className="py-3.5 px-5 text-xs text-muted-foreground whitespace-nowrap">
                        {r.delegate ? (
                          <span className="font-medium text-foreground">{r.delegate.name}</span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Non assigné</span>
                        )}
                      </TableCell>

                      {/* Montant TTC */}
                      <TableCell className="py-3.5 px-5 text-right font-bold text-xs text-foreground whitespace-nowrap font-mono">
                        {r.total_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      {/* Paiement */}
                      <TableCell className="py-3.5 px-5 text-right font-medium text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-mono">
                        {r.paid_amount > 0 ? r.paid_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '-'}
                      </TableCell>

                      {/* Reste à Payer */}
                      <TableCell className="py-3.5 px-5 text-right font-bold text-xs whitespace-nowrap font-mono">
                        {hasRemaining ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {r.remaining_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0.00</span>
                        )}
                      </TableCell>

                      {/* Mode / Dépôt */}
                      <TableCell className="py-3.5 px-5 text-center text-xs text-muted-foreground whitespace-nowrap">
                        <div className="font-medium text-foreground">{r.payment_mode || '-'}</div>
                        {r.depot_source && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[120px] mx-auto">
                            {r.depot_source}
                          </div>
                        )}
                      </TableCell>

                      {/* Statut */}
                      <TableCell className="py-3.5 px-5 text-center whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border',
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : hasRemaining
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-muted text-muted-foreground border-border/40'
                          )}
                        >
                          {r.status || 'Validé'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer matching DeliveryNotesTable */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 text-xs text-muted-foreground flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div>
                Total : <span className="font-bold text-foreground">{total.toLocaleString()}</span> vente(s)
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span>Par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="rounded-full border border-border/60 px-2 py-0.5 bg-muted/40 text-xs text-foreground focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-bold text-foreground">{page}</span> sur <span className="font-bold text-foreground">{Math.max(1, totalPages)}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
