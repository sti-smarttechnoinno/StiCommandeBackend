'use client';

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Eye,
  CheckCircle2,
  Truck,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Loader2,
} from 'lucide-react';
import type { DeliveryNoteData } from '../types';

interface DeliveryNotesTableProps {
  deliveryNotes: DeliveryNoteData[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onSelectDeliveryNote?: (dn: DeliveryNoteData) => void;
  onQuickMarkDelivered?: (dn: DeliveryNoteData) => void;
  filtersElement?: React.ReactNode;
}

export function DeliveryNotesTable({
  deliveryNotes,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onSelectDeliveryNote,
  onQuickMarkDelivered,
  filtersElement,
}: DeliveryNotesTableProps) {
  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card flex flex-col justify-between w-full">
      {/* Integrated Combined Header & Filters matching Orders */}
      <CardHeader className="pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Liste des Bons de Livraison</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{total} Bons</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Rechercher, filtrer et gérer tous les bons d&apos;expédition en temps réel
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
            <p className="text-xs font-semibold">Chargement des bons de livraison...</p>
          </div>
        </div>
      ) : deliveryNotes.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Aucun bon de livraison trouvé</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Les bons de livraison sont générés automatiquement dès qu&apos;une commande est validée (partiellement ou totalement).
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border/60">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap">Code BL</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap">Commande</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap">Date</TableHead>
                  <TableHead className="py-4 px-6 text-xs font-bold text-foreground min-w-[200px]">Client Destinataire</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap">Délégué Commercial</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-center whitespace-nowrap">Type Validation</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-center whitespace-nowrap">Articles</TableHead>
                  <TableHead className="py-4 px-6 text-xs font-bold text-foreground text-right whitespace-nowrap">Montant Total</TableHead>
                  <TableHead className="py-4 px-5 text-xs font-bold text-foreground text-center whitespace-nowrap">Statut</TableHead>
                  <TableHead className="py-4 px-4 text-xs font-bold text-foreground text-center w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryNotes.map((dn) => {
                  const isPartial = dn.validation_type === 'partial';
                  const isDelivered = dn.status === 'delivered';

                  return (
                    <TableRow
                      key={dn.id}
                      className="hover:bg-muted/40 transition-colors border-b border-border/40 group"
                    >
                      <TableCell className="py-3.5 px-5 font-bold font-mono text-xs text-primary">
                        {dn.delivery_note_code}
                      </TableCell>
                      <TableCell className="py-3.5 px-5 font-mono text-xs font-medium text-foreground">
                        {dn.order_code}
                      </TableCell>
                      <TableCell className="py-3.5 px-5 text-xs text-muted-foreground whitespace-nowrap">
                        {dn.created_at ? format(new Date(dn.created_at), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="py-3.5 px-6">
                        <div className="font-semibold text-xs text-foreground">
                          {dn.client_name || 'Client Inconnu'}
                        </div>
                        {dn.wilaya && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{dn.wilaya}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-5 text-xs text-muted-foreground">
                        {dn.delegate_name || '-'}
                      </TableCell>
                      <TableCell className="py-3.5 px-5 text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                            isPartial
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          )}
                        >
                          {isPartial ? 'Partielle' : 'Totale'}
                          {isPartial && dn.batch_number ? ` (Tranche #${dn.batch_number})` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-5 text-xs text-center font-bold text-foreground">
                        {dn.total_quantity}
                      </TableCell>
                      <TableCell className="py-3.5 px-6 text-xs text-right font-bold font-mono text-foreground whitespace-nowrap">
                        {new Intl.NumberFormat('fr-DZ', {
                          style: 'currency',
                          currency: 'DZD',
                          maximumFractionDigits: 0,
                        }).format(dn.total_amount)}
                      </TableCell>
                      <TableCell className="py-3.5 px-5 text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize',
                            isDelivered
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          )}
                        >
                          {isDelivered ? 'Livré' : dn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onSelectDeliveryNote && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onSelectDeliveryNote(dn)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Voir le Bon de Livraison"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {!isDelivered && onQuickMarkDelivered && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onQuickMarkDelivered(dn)}
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Marquer comme livré"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Link href={`/delivery-notes/${dn.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Page dédiée"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 text-xs text-muted-foreground">
            <div>
              Total : <span className="font-bold text-foreground">{total}</span> bon(s) de livraison
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-bold text-foreground">{page}</span> sur <span className="font-bold text-foreground">{totalPages}</span>
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