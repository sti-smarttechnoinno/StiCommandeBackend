'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RejectOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber?: string;
    clientName?: string;
    delegateName?: string;
    totalAmount?: number;
  } | null;
  onConfirm: (orderId: string, reason: string) => Promise<void> | void;
}

const COMMON_REASONS = [
  'Rupture définitive de stock',
  'Doublon de commande',
  'Client injoignable',
  'Annulation à la demande du client',
  'Plafond de crédit client dépassé',
  'Erreur de saisie ou coordonnées invalides',
];

export function RejectOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
}: RejectOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Veuillez préciser le motif du rejet de la commande.');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(order.id, trimmed);
      onOpenChange(false);
    } catch {
      // Error handling is handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Rejeter la commande {order.orderNumber || `#${order.id.slice(0, 8)}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {order.clientName ? `Client : ${order.clientName}` : 'Rejet de la commande'}
                {order.delegateName ? ` • Délégué : ${order.delegateName}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Warning Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Le rejet d&apos;une commande est une action critique. Le statut passera à <strong>Rejetée</strong> et les stocks éventuels seront automatiquement restitués.
            </span>
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Suggestions rapides
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted hover:text-foreground text-muted-foreground border border-border/50 transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="rejection-reason" className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Motif du rejet (Note explicative) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-muted-foreground font-normal">Obligatoire</span>
            </label>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez précisément la raison du rejet de cette commande..."
              rows={3}
              className="text-xs resize-none rounded-xl"
              autoFocus
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-xl text-xs font-semibold h-9"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !reason.trim()}
              className="gap-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs h-9 px-4"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Confirmer le rejet</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
