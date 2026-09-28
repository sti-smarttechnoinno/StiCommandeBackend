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
import { toast } from 'sonner';
import { CheckCircle2, UserCheck, Loader2, ArrowRight } from 'lucide-react';
import { crmLeadsService } from '@/services/crm-pipeline';
import type { CrmLead, ConvertLeadParams } from '@/types/crm-pipeline';
import { useRouter } from 'next/navigation';

interface ConvertLeadDialogProps {
  lead: CrmLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: ConvertLeadDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientType, setClientType] = useState<'retail' | 'wholesale' | 'corporate' | 'government'>('retail');
  const [clientCode, setClientCode] = useState('');
  const [notes, setNotes] = useState('');

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      const payload: ConvertLeadParams = {
        client_type: clientType,
        client_code: clientCode.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await crmLeadsService.convert(lead.id, payload);
      toast.success(`Prospect "${lead.company_name}" converti en client avec succès !`);

      window.dispatchEvent(new CustomEvent('sti-crm-lead-updated'));
      onOpenChange(false);
      onSuccess?.();

      if (res.client?.id) {
        router.push(`/clients/${res.client.id}`);
      }
    } catch {
      toast.error('Erreur lors de la conversion du prospect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Convertir en Client Officiel</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ce prospect sera intégré dans le registre des clients pour la facturation et les commandes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConvert} className="space-y-3.5 pt-2">
          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">{lead?.company_name}</span>
              <span className="text-muted-foreground font-mono text-[11px]">{lead?.wilaya}</span>
            </div>
            <p className="text-muted-foreground">
              Contact : <strong className="text-foreground">{lead?.name}</strong> • {lead?.phone}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Type de client *</label>
            <Select
              value={clientType}
              onValueChange={(val) => setClientType((val || 'retail') as 'retail' | 'wholesale' | 'corporate' | 'government')}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="retail" className="text-xs">Détaillant / Pharmacie (Retail)</SelectItem>
                <SelectItem value="wholesale" className="text-xs">Grossiste (Wholesale)</SelectItem>
                <SelectItem value="corporate" className="text-xs">Clinique / Entreprise (Corporate)</SelectItem>
                <SelectItem value="government" className="text-xs">Hôpital / Étatique (Government)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Code Client personnalisé (Optionnel)</label>
            <Input
              placeholder="Ex: CLT-00123 (Laisser vide pour génération auto)"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Notes de conversion</label>
            <Textarea
              placeholder="Conditions accordées, historique de la négociation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl resize-none h-20"
            />
          </div>

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
              className="rounded-xl h-9 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Convertir & Ouvrir la fiche</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
