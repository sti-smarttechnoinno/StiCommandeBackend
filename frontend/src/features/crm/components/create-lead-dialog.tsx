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
import { UserPlus, Loader2 } from 'lucide-react';
import { crmLeadsService } from '@/services/crm-pipeline';
import type { CrmLead, LeadStatus, LeadSource, CreateLeadParams } from '@/types/crm-pipeline';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadToEdit?: CrmLead | null;
  onSuccess?: () => void;
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'field_prospection', label: 'Prospection Terrain' },
  { value: 'inbound_call', label: 'Appel entrant' },
  { value: 'recommendation', label: 'Recommandation' },
  { value: 'event', label: 'Salon / Événement' },
  { value: 'other', label: 'Autre' },
];

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nouveau' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'qualified', label: 'Qualifié' },
  { value: 'lost', label: 'Non retenu' },
];

export function CreateLeadDialog({
  open,
  onOpenChange,
  leadToEdit,
  onSuccess,
}: CreateLeadDialogProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState<LeadSource>('field_prospection');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (leadToEdit) {
        setName(leadToEdit.name);
        setCompanyName(leadToEdit.company_name);
        setPhone(leadToEdit.phone);
        setEmail(leadToEdit.email || '');
        setRegion(leadToEdit.region);
        setWilaya(leadToEdit.wilaya);
        setAddress(leadToEdit.address || '');
        setSource(leadToEdit.source);
        setStatus(leadToEdit.status);
        setEstimatedBudget(leadToEdit.estimated_budget ? String(leadToEdit.estimated_budget) : '');
        setNotes(leadToEdit.notes || '');
      } else {
        setName('');
        setCompanyName('');
        setPhone('');
        setEmail('');
        setRegion('Centre');
        setWilaya('Alger');
        setAddress('');
        setSource('field_prospection');
        setStatus('new');
        setEstimatedBudget('');
        setNotes('');
      }
    }
  }, [open, leadToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error('Veuillez renseigner le nom de l’établissement ou société.');
      return;
    }

    if (!name.trim()) {
      toast.error('Veuillez renseigner le nom du contact.');
      return;
    }

    if (!phone.trim()) {
      toast.error('Veuillez renseigner un numéro de téléphone.');
      return;
    }

    if (!wilaya.trim() || !region.trim()) {
      toast.error('Veuillez renseigner la région et la wilaya.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateLeadParams = {
        name: name.trim(),
        company_name: companyName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        region: region.trim(),
        wilaya: wilaya.trim(),
        address: address.trim() || undefined,
        source,
        status,
        estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
        notes: notes.trim() || undefined,
      };

      if (leadToEdit) {
        await crmLeadsService.update(leadToEdit.id, payload);
        toast.success('Prospect mis à jour avec succès.');
      } else {
        await crmLeadsService.create(payload);
        toast.success('Nouveau prospect enregistré avec succès.');
      }

      window.dispatchEvent(new CustomEvent('sti-crm-lead-updated'));
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Erreur lors de l’enregistrement du prospect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {leadToEdit ? 'Modifier le Prospect' : 'Nouveau Prospect (Lead)'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enregistrez un nouveau contact commercial avant sa conversion en client.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Établissement / Société */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Nom de l’établissement / Société *</label>
            <Input
              placeholder="Ex: Pharmacie de la Gare, Clinique Al Azhar..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-9 text-xs rounded-xl"
              required
            />
          </div>

          {/* Contact & Téléphone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Nom du Contact *</label>
              <Input
                placeholder="Ex: Dr. Benali Mohamed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Téléphone *</label>
              <Input
                placeholder="Ex: 0550 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Courriel (Optionnel)</label>
            <Input
              type="email"
              placeholder="Ex: contact@pharmacie.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Région & Wilaya */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Région *</label>
              <Input
                placeholder="Ex: Centre, Ouest, Est..."
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Wilaya *</label>
              <Input
                placeholder="Ex: Alger, Oran, Blida..."
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Adresse / Localisation</label>
            <Input
              placeholder="Ex: 14 Rue Didouche Mourad, Alger Centre"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Source & Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Origine / Source</label>
              <Select value={source} onValueChange={(val) => setSource((val || 'field_prospection') as LeadSource)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Statut initial</label>
              <Select value={status} onValueChange={(val) => setStatus((val || 'new') as LeadStatus)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {STATUSES.map((st) => (
                    <SelectItem key={st.value} value={st.value} className="text-xs">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Budget estimé */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Budget d'achat estimé (DZD)</label>
            <Input
              type="number"
              min="0"
              placeholder="Ex: 500000"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Notes & Observations</label>
            <Textarea
              placeholder="Besoins exprimés, horaires de passage favorables, décideur..."
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
              <span>{leadToEdit ? 'Sauvegarder' : 'Créer le prospect'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
