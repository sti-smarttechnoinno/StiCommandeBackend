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
import { Target, Loader2 } from 'lucide-react';
import { crmOpportunitiesService, crmLeadsService } from '@/services/crm-pipeline';
import { clientsService, type ClientData } from '@/services/clients';
import type {
  CrmOpportunity,
  CrmLead,
  OpportunityStage,
  OpportunityPriority,
  CreateOpportunityParams,
} from '@/types/crm-pipeline';

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityToEdit?: CrmOpportunity | null;
  defaultStage?: OpportunityStage;
  defaultClientId?: number;
  defaultLeadId?: number;
  onSuccess?: () => void;
}

const STAGE_OPTIONS: { value: OpportunityStage; label: string; defaultProb: number }[] = [
  { value: 'qualification', label: '1. Qualification', defaultProb: 20 },
  { value: 'proposal', label: '2. Devis / Proposition', defaultProb: 50 },
  { value: 'negotiation', label: '3. Négociation', defaultProb: 80 },
  { value: 'won', label: '4. Gagnée', defaultProb: 100 },
  { value: 'lost', label: '5. Perdue', defaultProb: 0 },
];

export function OpportunityDialog({
  open,
  onOpenChange,
  opportunityToEdit,
  defaultStage = 'qualification',
  defaultClientId,
  defaultLeadId,
  onSuccess,
}: OpportunityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'client' | 'lead'>('client');
  const [clients, setClients] = useState<ClientData[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<OpportunityStage>(defaultStage);
  const [probability, setProbability] = useState<number>(20);
  const [priority, setPriority] = useState<OpportunityPriority>('medium');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      // Load clients
      clientsService.list({ pageSize: 100 }).then((res) => {
        if (res?.data) setClients(res.data);
      }).catch(() => {});

      // Load leads
      crmLeadsService.list({ per_page: 100, status: 'all' }).then((res) => {
        if (res?.data) setLeads(res.data);
      }).catch(() => {});

      if (opportunityToEdit) {
        setTitle(opportunityToEdit.title);
        setAmount(String(opportunityToEdit.amount || ''));
        setStage(opportunityToEdit.stage);
        setProbability(opportunityToEdit.probability);
        setPriority(opportunityToEdit.priority);
        setExpectedDate(opportunityToEdit.expected_closing_date || '');
        setNotes(opportunityToEdit.notes || '');

        if (opportunityToEdit.client_id) {
          setTargetType('client');
          setSelectedClientId(opportunityToEdit.client_id);
          setSelectedLeadId(null);
        } else if (opportunityToEdit.lead_id) {
          setTargetType('lead');
          setSelectedLeadId(opportunityToEdit.lead_id);
          setSelectedClientId(null);
        }
      } else {
        setTitle('');
        setAmount('');
        const initStage = defaultStage || 'qualification';
        setStage(initStage);
        const stageOpt = STAGE_OPTIONS.find((s) => s.value === initStage);
        setProbability(stageOpt ? stageOpt.defaultProb : 20);
        setPriority('medium');
        setExpectedDate('');
        setNotes('');

        if (defaultLeadId) {
          setTargetType('lead');
          setSelectedLeadId(defaultLeadId);
          setSelectedClientId(null);
        } else {
          setTargetType('client');
          setSelectedClientId(defaultClientId || null);
          setSelectedLeadId(null);
        }
      }
    }
  }, [open, opportunityToEdit, defaultStage, defaultClientId, defaultLeadId]);

  const handleStageChange = (newStage: OpportunityStage) => {
    setStage(newStage);
    const opt = STAGE_OPTIONS.find((s) => s.value === newStage);
    if (opt) setProbability(opt.defaultProb);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Veuillez indiquer un titre d’opportunité.');
      return;
    }

    if (targetType === 'client' && !selectedClientId) {
      toast.error('Veuillez sélectionner un client.');
      return;
    }

    if (targetType === 'lead' && !selectedLeadId) {
      toast.error('Veuillez sélectionner un prospect.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('Veuillez saisir un montant estimé valide.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOpportunityParams = {
        title: title.trim(),
        client_id: targetType === 'client' ? (selectedClientId ?? undefined) : undefined,
        lead_id: targetType === 'lead' ? (selectedLeadId ?? undefined) : undefined,
        amount: numAmount,
        stage,
        probability: Number(probability),
        priority,
        expected_closing_date: expectedDate || undefined,
        notes: notes.trim() || undefined,
      };

      if (opportunityToEdit) {
        await crmOpportunitiesService.update(opportunityToEdit.id, payload);
        toast.success('Opportunité mise à jour avec succès.');
      } else {
        await crmOpportunitiesService.create(payload);
        toast.success('Opportunité créée avec succès.');
      }

      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {opportunityToEdit ? 'Modifier l’opportunité' : 'Nouvelle opportunité commerciale'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Associez une affaire en cours de négociation à un client ou à un prospect.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Titre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Titre de l’affaire *</label>
            <Input
              placeholder="Ex: Réassort annuel 50 cartons, Équipement clinique..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs rounded-xl"
              required
            />
          </div>

          {/* Type de cible : Client vs Prospect */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Cible de vente *</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border">
              <button
                type="button"
                onClick={() => {
                  setTargetType('client');
                  setSelectedLeadId(null);
                }}
                className={`text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                  targetType === 'client'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType('lead');
                  setSelectedClientId(null);
                }}
                className={`text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                  targetType === 'lead'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nouveau Prospect
              </button>
            </div>
          </div>

          {/* Select Client or Lead */}
          {targetType === 'client' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Sélectionner le Client *</label>
              <Select
                value={selectedClientId ? String(selectedClientId) : ''}
                onValueChange={(val) => setSelectedClientId(val ? Number(val) : null)}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Choisir un client..." />
                </SelectTrigger>
                <SelectContent className="max-h-56 rounded-xl">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name} ({c.wilaya || c.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Sélectionner le Prospect *</label>
              <Select
                value={selectedLeadId ? String(selectedLeadId) : ''}
                onValueChange={(val) => setSelectedLeadId(val ? Number(val) : null)}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Choisir un prospect..." />
                </SelectTrigger>
                <SelectContent className="max-h-56 rounded-xl">
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)} className="text-xs">
                      {l.company_name} ({l.name} - {l.wilaya})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Montant & Probabilité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Montant estimé (DZD) *</label>
              <Input
                type="number"
                min="0"
                step="100"
                placeholder="Ex: 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Probabilité (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Étape & Priorité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Étape du Pipeline</label>
              <Select value={stage} onValueChange={(val) => handleStageChange((val || 'qualification') as OpportunityStage)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Priorité</label>
              <Select value={priority} onValueChange={(val) => setPriority((val || 'medium') as OpportunityPriority)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low" className="text-xs">Basse</SelectItem>
                  <SelectItem value="medium" className="text-xs">Moyenne</SelectItem>
                  <SelectItem value="high" className="text-xs font-semibold text-rose-600">Haute 🔥</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date de signature prévisionnelle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Date de clôture estimée</label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Notes & Commentaires</label>
            <Textarea
              placeholder="Détails des besoins, concurrents identifiés, remises convenues..."
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
              className="rounded-xl h-9 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{opportunityToEdit ? 'Sauvegarder' : 'Créer l’opportunité'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
