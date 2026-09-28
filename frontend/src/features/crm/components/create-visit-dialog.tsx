'use client';

import { useState, useEffect } from 'react';
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
import { CalendarCheck, Loader2, Search } from 'lucide-react';
import { crmVisitsService } from '@/services/crm';
import { clientsService, type ClientData } from '@/services/clients';
import type { VisitPurpose } from '@/types/crm';

interface CreateVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: number;
  onSuccess?: () => void;
}

const PURPOSE_OPTIONS: { value: VisitPurpose; label: string }[] = [
  { value: 'order_taking', label: 'Prise de commande' },
  { value: 'prospecting', label: 'Prospection & Présentation' },
  { value: 'debt_collection', label: 'Recouvrement de créance' },
  { value: 'relationship', label: 'Fidélisation / Courtoisie' },
  { value: 'claim', label: 'Réclamation / SAV' },
];

export function CreateVisitDialog({
  open,
  onOpenChange,
  defaultClientId,
  onSuccess,
}: CreateVisitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(defaultClientId || null);
  const [plannedDate, setPlannedDate] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setHours(now.getHours() + 1);
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [purpose, setPurpose] = useState<VisitPurpose>('order_taking');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (defaultClientId) {
      setSelectedClientId(defaultClientId);
    }
  }, [defaultClientId]);

  useEffect(() => {
    if (open) {
      clientsService
        .list({ pageSize: 100, search: clientSearch || undefined })
        .then((res) => {
          if (res?.data) {
            setClients(res.data);
            if (!selectedClientId && res.data.length > 0 && !defaultClientId) {
              setSelectedClientId(Number(res.data[0].id));
            }
          }
        })
        .catch(() => {});
    }
  }, [open, clientSearch, defaultClientId, selectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client.');
      return;
    }
    if (!plannedDate) {
      toast.error('Veuillez indiquer la date et l’heure de la visite.');
      return;
    }

    setLoading(true);
    try {
      await crmVisitsService.create({
        client_id: selectedClientId,
        planned_at: plannedDate,
        purpose,
        summary: summary.trim() || undefined,
      });

      toast.success('Visite planifiée avec succès !');
      window.dispatchEvent(new CustomEvent('sti-crm-visit-created'));
      onOpenChange(false);
      setSummary('');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la planification de la visite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Planifier une Visite Client</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Programmez un rendez-vous terrain ou une tournée commerciale.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Client Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Client Cible *</label>
            <div className="relative">
              <Select
                value={selectedClientId ? String(selectedClientId) : ''}
                onValueChange={(val) => setSelectedClientId(Number(val))}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Choisir un client..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Filtrer les clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="h-8 text-xs rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-[11px]">
                        ({c.clientCode || `CLT-${c.id}`}) - {c.wilaya || c.region}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Date & Heure prévues *</label>
            <Input
              type="datetime-local"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Motif de la visite *</label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as VisitPurpose)}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PURPOSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes / Objectif */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Objectif / Note préparatoire (Optionnel)</label>
            <Textarea
              placeholder="Ex: Présenter la nouvelle gamme d'accessoires, vérifier les factures en attente..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
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
              className="rounded-xl h-9 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Planifier la visite</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
