'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatFullDate } from '../utils';
import type { ExtendedOrder } from '../types';
import { MapPin, FileText, Package, CheckCircle2, Minus, Plus, RotateCcw, AlertCircle, ShieldCheck, Loader2, ExternalLink, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { ordersService } from '@/services/orders';

interface OrderExpandedRowProps {
  order: ExtendedOrder;
  onUpdateStatus?: (orderId: string, status: string, validatedItems?: Record<string, number>) => void;
}

export function OrderExpandedRow({ order, onUpdateStatus }: OrderExpandedRowProps) {
  const router = useRouter();
  const [orderStatus, setOrderStatus] = useState<string>(order.status || 'pending');
  const [submitting, setSubmitting] = useState(false);

  // Fully completed only if validated or delivered
  const isFullyCompleted = orderStatus === 'validated' || orderStatus === 'delivered';
  const isCurrentlyPartial = orderStatus === 'partially_validated';

  // For orders already partially validated, track the ADDITIONAL quantity for the remaining balance
  const [validatedQty, setValidatedQty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    (order.items || []).forEach((item) => {
      if (isCurrentlyPartial) {
        // If already partially validated, default additional qty to the remaining balance
        const alreadyVal = item.validatedQuantity ?? 0;
        const rem = Math.max(0, item.quantity - alreadyVal);
        initial[item.id] = rem;
      } else {
        // Pending order: default to 100% quantity
        initial[item.id] = item.quantity;
      }
    });
    return initial;
  });

  const totalOrderedQty = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  // Calculate already validated totals vs new additional validation totals
  const totalAlreadyValQty = (order.items || []).reduce((sum, item) => {
    return sum + (isCurrentlyPartial ? (item.validatedQuantity ?? 0) : isFullyCompleted ? item.quantity : 0);
  }, 0);

  const totalRemainingToValidateQty = isFullyCompleted ? 0 : totalOrderedQty - totalAlreadyValQty;

  const newSelectedQtySum = (order.items || []).reduce((sum, item) => {
    const val = validatedQty[item.id] ?? 0;
    return sum + val;
  }, 0);

  const finalTotalValidatedQty = isFullyCompleted
    ? totalOrderedQty
    : isCurrentlyPartial
    ? totalAlreadyValQty + newSelectedQtySum
    : newSelectedQtySum;

  const newSelectedAmountSum = (order.items || []).reduce((sum, item) => {
    const val = validatedQty[item.id] ?? 0;
    return sum + val * item.unitPrice;
  }, 0);

  const totalAlreadyValAmount = (order.items || []).reduce((sum, item) => {
    const alreadyVal = isCurrentlyPartial ? (item.validatedQuantity ?? 0) : 0;
    return sum + alreadyVal * item.unitPrice;
  }, 0);

  const isFullValidation = finalTotalValidatedQty === totalOrderedQty;
  const isPartialValidation = finalTotalValidatedQty < totalOrderedQty && newSelectedQtySum > 0;
  const isZeroSelection = newSelectedQtySum === 0;

  const handleQtyChange = (itemId: string, maxQtyAllowed: number, delta: number) => {
    if (isFullyCompleted) return;
    setValidatedQty((prev) => {
      const current = prev[itemId] ?? maxQtyAllowed;
      const next = Math.max(0, Math.min(maxQtyAllowed, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleResetFull = () => {
    if (isFullyCompleted) return;
    const reset: Record<string, number> = {};
    (order.items || []).forEach((item) => {
      if (isCurrentlyPartial) {
        const alreadyVal = item.validatedQuantity ?? 0;
        reset[item.id] = Math.max(0, item.quantity - alreadyVal);
      } else {
        reset[item.id] = item.quantity;
      }
    });
    setValidatedQty(reset);
    toast.info('Quantités réinitialisées au reste à valider.');
  };

  const handleValidateOrder = async () => {
    if (isZeroSelection && !isFullValidation) {
      toast.error('Veuillez sélectionner au moins 1 unité à valider.');
      return;
    }

    const payloadValidatedItems: Record<string, number> = {};
    (order.items || []).forEach((item) => {
      if (isCurrentlyPartial) {
        const alreadyVal = item.validatedQuantity ?? 0;
        payloadValidatedItems[item.id] = alreadyVal + (validatedQty[item.id] ?? 0);
      } else {
        payloadValidatedItems[item.id] = validatedQty[item.id] ?? item.quantity;
      }
    });

    const targetStatus = isFullValidation ? 'validated' : 'partially_validated';
    setSubmitting(true);

    try {
      const res = await ordersService.updateStatus(order.id, targetStatus, payloadValidatedItems);

      setOrderStatus(targetStatus);
      onUpdateStatus?.(order.id, targetStatus, payloadValidatedItems);

      const blCode = res?.delivery_note?.delivery_note_code;
      const blMsg = blCode ? ` — Bon de Livraison généré : ${blCode}` : '';

      toast.success(
        `Commande ${order.orderNumber || ''} ${isFullValidation ? 'entièrement validée (Validation Totale 100%)' : 'partiellement validée'} (${finalTotalValidatedQty}/${totalOrderedQty} unités)${blMsg}`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la validation de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order.items || order.items.length === 0) {
    return (
      <div className="bg-muted/20 p-6 border-t border-border/30 text-center">
        <p className="text-xs font-bold text-foreground">Aucun article enregistré pour cette commande.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 px-6 py-4 border-t border-border/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products Breakdown & Unit Validation Section */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {isCurrentlyPartial ? 'Validation du Reste de la Commande' : 'Détail des Produits & Validation par Unité'}
              </h4>
            </div>

            {/* Validation Status Badge */}
            <div className="flex items-center gap-2">
              {isFullyCompleted ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Validation Totale ({finalTotalValidatedQty}/${totalOrderedQty} unités)</span>
                </Badge>
              ) : isFullValidation ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5">
                  Prêt pour Validation Totale ({finalTotalValidatedQty}/${totalOrderedQty} unités)
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5">
                  {isCurrentlyPartial ? `Reste à valider: ${totalRemainingToValidateQty} unités` : `Validation Partielle (${finalTotalValidatedQty}/${totalOrderedQty} unités)`}
                </Badge>
              )}
            </div>
          </div>

          {/* Banners */}
          {isFullyCompleted ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  Cette commande a été entièrement traitée et validée (Validation Totale 100%).
                </span>
              </div>
              <Badge variant="outline" className="bg-emerald-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Terminée
              </Badge>
            </div>
          ) : isCurrentlyPartial ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>
                  Déjà validé: <strong>{totalAlreadyValQty} / {totalOrderedQty} unités</strong> ({formatCurrency(totalAlreadyValAmount)}). Saisissez ci-dessous les unités restantes à valider.
                </span>
              </div>
              <Badge variant="outline" className="bg-amber-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Validation du Reste
              </Badge>
            </div>
          ) : null}

          {/* Interactive Products Table */}
          <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr>
                  <th className="text-left font-bold text-muted-foreground px-3 py-2.5">Produit</th>
                  <th className="text-left font-bold text-muted-foreground px-3 py-2.5">SKU</th>
                  <th className="text-center font-bold text-muted-foreground px-3 py-2.5">Quantité Commandée</th>
                  {isCurrentlyPartial && (
                    <th className="text-center font-bold text-emerald-600 px-3 py-2.5">Déjà Validée</th>
                  )}
                  <th className="text-center font-bold text-muted-foreground px-3 py-2.5">
                    {isCurrentlyPartial ? 'Reste à Valider' : 'Quantité Validée'}
                  </th>
                  <th className="text-right font-bold text-muted-foreground px-3 py-2.5">Prix Unitaire</th>
                  <th className="text-right font-bold text-muted-foreground px-3 py-2.5">
                    {isCurrentlyPartial ? 'Montant du Reste' : 'Sous-Total Validé'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => {
                  const alreadyVal = isCurrentlyPartial ? (item.validatedQuantity ?? 0) : 0;
                  const remainingLimit = isCurrentlyPartial ? Math.max(0, item.quantity - alreadyVal) : item.quantity;
                  const currentStepperVal = isFullyCompleted ? item.quantity : (validatedQty[item.id] ?? remainingLimit);
                  const lineAmount = currentStepperVal * item.unitPrice;

                  return (
                    <tr key={item.id} className="border-t border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-foreground">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono text-[11px]">
                        {item.sku}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-muted-foreground">
                        {item.quantity} unités
                      </td>

                      {isCurrentlyPartial && (
                        <td className="px-3 py-2.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                          {alreadyVal} unités
                        </td>
                      )}

                      {/* Stepper for validating remaining balance */}
                      <td className="px-3 py-2.5 text-center">
                        <div className={cn(
                          "inline-flex items-center gap-1 rounded-lg p-0.5",
                          isFullyCompleted ? "bg-muted/30 border border-transparent" : "bg-muted/60 border border-border/50"
                        )}>
                          {!isFullyCompleted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-background text-foreground"
                              onClick={() => handleQtyChange(item.id, remainingLimit, -1)}
                              disabled={currentStepperVal <= 0}
                              title="Diminuer 1 unité"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}

                          <span className={cn(
                            "w-10 text-center font-bold text-xs px-1",
                            currentStepperVal === remainingLimit ? "text-emerald-600 dark:text-emerald-400" : currentStepperVal > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600"
                          )}>
                            {currentStepperVal}
                          </span>

                          {!isFullyCompleted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-background text-foreground"
                              onClick={() => handleQtyChange(item.id, remainingLimit, 1)}
                              disabled={currentStepperVal >= remainingLimit}
                              title="Ajouter 1 unité"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right text-muted-foreground font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-foreground">
                        {formatCurrency(lineAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/40 border-t border-border/40">
                <tr>
                  <td colSpan={isCurrentlyPartial ? 4 : 3} className="px-3 py-2.5 text-right font-bold text-muted-foreground">
                    {isCurrentlyPartial ? 'Nouveaux Articles à Valider :' : 'Total Validé :'}
                  </td>
                  <td className="px-3 py-2.5 text-center font-extrabold text-foreground">
                    {isCurrentlyPartial ? `${newSelectedQtySum} / ${totalRemainingToValidateQty} unités restantes` : `${finalTotalValidatedQty} / ${totalOrderedQty} unités`}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-muted-foreground">
                    {isCurrentlyPartial ? 'Montant du Reste :' : 'Montant Validé :'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-extrabold text-primary text-sm">
                    {formatCurrency(isCurrentlyPartial ? newSelectedAmountSum : (totalAlreadyValAmount + newSelectedAmountSum))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Validation Action Buttons (Hidden only when Order is Fully Validated) */}
          {!isFullyCompleted && (
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFull}
                className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border/60 hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Réinitialiser les Unités</span>
              </Button>

              <div className="flex items-center gap-2">
                {isZeroSelection ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled
                    className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Sélectionnez les unités restantes à valider</span>
                  </Button>
                ) : isFullValidation ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting}
                    onClick={handleValidateOrder}
                    className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{isCurrentlyPartial ? `Valider le Reste (${newSelectedQtySum}/${totalRemainingToValidateQty} unités — ${formatCurrency(newSelectedAmountSum)})` : `Valider la commande (Validation Totale 100% — ${formatCurrency(newSelectedAmountSum)})`}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting}
                    onClick={handleValidateOrder}
                    className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    <span>{isCurrentlyPartial ? `Valider la Suite (${newSelectedQtySum}/${totalRemainingToValidateQty} unités restantes — ${formatCurrency(newSelectedAmountSum)})` : `Valider Partiellement (${newSelectedQtySum}/${totalOrderedQty} unités — ${formatCurrency(newSelectedAmountSum)})`}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="space-y-3">
          {order.deliveryAddress && (
            <Card className="border border-border/40 shadow-xs rounded-xl">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse de Livraison</h4>
                </div>
                <p className="text-xs text-foreground font-medium">{order.deliveryAddress}</p>
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card className="border border-border/40 shadow-xs rounded-xl">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h4>
                </div>
                <p className="text-xs text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border border-border/40 shadow-xs rounded-xl">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Date de Création</span>
                <span className="text-xs font-semibold text-foreground">{formatFullDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Statut Commande</span>
                <Badge variant="outline" className={cn(
                  "text-[11px] font-bold px-2 py-0.5 capitalize",
                  isFullyCompleted ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : isCurrentlyPartial ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-slate-500/10 text-slate-600 border-slate-500/30"
                )}>
                  {isFullyCompleted ? 'Validée (Totale)' : isCurrentlyPartial ? 'Validée (Partielle)' : orderStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/orders/${order.id}`)}
              className="w-full text-xs font-semibold gap-2 rounded-xl h-9 border-primary/30 text-primary hover:bg-primary/10 transition-all shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Voir la page détaillée</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/delivery-notes?order_id=${order.id}`)}
              className="w-full text-xs font-semibold gap-2 rounded-xl h-9 border-border/70 text-foreground hover:bg-muted/80 transition-all shadow-xs"
            >
              <Truck className="h-3.5 w-3.5 text-primary" />
              <span>Bons de Livraison associés</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
