'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Printer, CheckCircle2, Truck, Clock, XCircle, MapPin, User, Calendar, FileText, Check } from 'lucide-react';
import type { DeliveryNoteData } from '../types';
import { deliveryNotesService } from '@/services/delivery-notes';

interface DeliveryNoteModalProps {
  deliveryNote: DeliveryNoteData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
}

export function DeliveryNoteModal({
  deliveryNote,
  open,
  onOpenChange,
  onStatusUpdated,
}: DeliveryNoteModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!deliveryNote) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsDelivered = async () => {
    setUpdating(true);
    try {
      await deliveryNotesService.updateStatus(deliveryNote.id, 'delivered');
      toast.success(`Bon de livraison ${deliveryNote.delivery_note_code} marqué comme livré.`);
      onStatusUpdated?.();
      onOpenChange(false);
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdating(false);
    }
  };

  const isDelivered = deliveryNote.status === 'delivered';
  const isPartial = deliveryNote.validation_type === 'partial';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border/60 bg-card shadow-2xl">
        {/* Printable Area */}
        <div id="printable-delivery-note" className="p-8 space-y-6 print:p-0 print:m-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 pb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl bg-muted/40 p-2 flex items-center justify-center border border-border/40">
                <Image
                  src="/assets/logo-sti.png"
                  alt="STI Distribution"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">STI Distribution</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Système de Gestion Commerciale & Logistique</p>
                <p className="text-[11px] text-muted-foreground/80">Distribution Télécom & Puces - Algérie</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <FileText className="h-3.5 w-3.5" />
                <span>BON DE LIVRAISON</span>
              </div>
              <p className="text-lg font-black tracking-tight text-foreground font-mono">
                {deliveryNote.delivery_note_code}
              </p>
              <p className="text-xs text-muted-foreground">
                Date : {deliveryNote.created_at ? format(new Date(deliveryNote.created_at), 'dd/MM/yyyy HH:mm') : '-'}
              </p>
            </div>
          </div>

          {/* Validation & Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Type de validation :</span>
              {isPartial ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5">
                  Validation Partielle (Tranche #{deliveryNote.batch_number})
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5">
                  Validation Totale (100%)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Statut livraison :</span>
              {deliveryNote.status === 'delivered' ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Livré
                </Badge>
              ) : deliveryNote.status === 'in_transit' ? (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold px-2.5 py-0.5 gap-1">
                  <Truck className="h-3 w-3" /> En Transit
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 capitalize">
                  {deliveryNote.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Information Grid: Client & Commande */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Destinataire (Client)</span>
              </div>
              <p className="text-sm font-bold text-foreground">{deliveryNote.client_name}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{deliveryNote.wilaya} ({deliveryNote.region})</span>
                </p>
                {deliveryNote.delivery_address && (
                  <p>Adresse : {deliveryNote.delivery_address}</p>
                )}
                {deliveryNote.client?.phone && (
                  <p>Tél : {deliveryNote.client.phone}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Détails de la Commande</span>
              </div>
              <p className="text-sm font-bold text-foreground">Réf : {deliveryNote.order_code}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Délégué Commercial : <span className="font-semibold text-foreground">{deliveryNote.delegate_name || '-'}</span></p>
                <p>Validé par : <span className="font-semibold text-foreground">{deliveryNote.validated_by || '-'}</span></p>
                {deliveryNote.delivered_at && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Livré le : {format(new Date(deliveryNote.delivered_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-bold">Produit / Article</TableHead>
                  <TableHead className="text-xs font-bold">Réf.</TableHead>
                  <TableHead className="text-xs font-bold text-center">Quantité Livrée</TableHead>
                  <TableHead className="text-xs font-bold text-right">Prix Unitaire</TableHead>
                  <TableHead className="text-xs font-bold text-right">Montant (DA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deliveryNote.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-semibold text-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.product_name}</span>
                        {item.is_gift && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            🎁 Cadeau / Offert
                          </span>
                        )}
                        {!item.is_gift && item.discount_percent && item.discount_percent > 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                            -{item.discount_percent}%
                          </span>
                        ) : null}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-muted-foreground italic mt-0.5">
                          Note : {item.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {item.reference || '-'}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-center text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted font-mono">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">
                      {item.is_gift ? (
                        <span className="line-through text-muted-foreground/60 mr-1.5">
                          {item.unit_price.toLocaleString('fr-DZ')} DA
                        </span>
                      ) : null}
                      <span>{item.unit_price.toLocaleString('fr-DZ')} DA</span>
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold text-foreground font-mono">
                      {item.is_gift ? (
                        <span className="text-purple-600 dark:text-purple-400 font-bold">0 DA (Offert)</span>
                      ) : (
                        `${item.subtotal.toLocaleString('fr-DZ')} DA`
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-64 p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Unités :</span>
                <span className="font-bold text-foreground">{deliveryNote.total_quantity}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/40">
                <span>Montant Total :</span>
                <span className="text-primary font-mono">{deliveryNote.total_amount.toLocaleString('fr-DZ')} DA</span>
              </div>
            </div>
          </div>

          {/* Signatures Area */}
          <div className="pt-6 border-t border-border/60 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-12">
              <p className="font-bold text-muted-foreground uppercase tracking-wider">Visa Magasinier / Délégué</p>
              <div className="border-b border-dashed border-border/80 w-36 mx-auto"></div>
            </div>
            <div className="space-y-12">
              <p className="font-bold text-muted-foreground uppercase tracking-wider">Accusé de Réception Client</p>
              <div className="border-b border-dashed border-border/80 w-36 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Footer Actions (hidden in print) */}
        <div className="flex items-center justify-between p-4 border-t border-border/60 bg-muted/20 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-semibold"
          >
            Fermer
          </Button>

          <div className="flex items-center gap-2">
            {!isDelivered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsDelivered}
                disabled={updating}
                className="rounded-xl text-xs font-semibold gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Marquer Livré</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer A4</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}