'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { crmOpportunitiesService } from '@/services/crm-pipeline';
import type { CrmOpportunity } from '@/types/crm-pipeline';

interface LostReasonDialogProps {
  opportunity: CrmOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Prix trop élevé / Offre concurrente plus agressive',
  'Rupture de stock / Délais de livraison trop longs',
  'Projet annulé ou reporté par le client',
  'Budget non alloué / Trésorerie insuffisante',
  'Absence de réponse / Perte de contact',
  'Autre motif',
];

export function LostReasonDialog({
  opportunity,
  open,
  onOpenChange,
  onSuccess,
}: LostReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity) return;

    const finalReason = selectedReason === 'Autre motif' ? customReason.trim() : selectedReason;
    if (!finalReason) {
      toast.error('Veuillez préciser le motif de perte.');
      return;
    }

    setLoading(true);
    try {
      await crmOpportunitiesService.updateStage(opportunity.id, {
        stage: 'lost',
        lost_reason: finalReason,
      });

      toast.success('Opportunité marquée comme perdue.');
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Erreur lors de la mise à jour de l’opportunité.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Marquer l’opportunité comme perdue</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Documentez le motif d’abandon pour analyser les freins commerciaux.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
            <p className="font-semibold text-foreground">{opportunity?.title}</p>
            <p className="text-muted-foreground">
              {opportunity?.client?.name || opportunity?.lead?.company_name || 'Prospect'} -{' '}
              {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(
                opportunity?.amount || 0
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Motif principal *</label>
            <Select value={selectedReason} onValueChange={(val) => setSelectedReason(val || COMMON_REASONS[0])}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {COMMON_REASONS.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'Autre motif' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Précisez le motif *</label>
              <Textarea
                placeholder="Expliquez la raison du refus..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="text-xs rounded-xl resize-none h-20"
                required
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 text-xs"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl h-9 text-xs font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirmer la perte</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
