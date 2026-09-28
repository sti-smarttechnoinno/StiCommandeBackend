'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  CalendarCheck,
  MessageSquare,
  Mail,
  FileText,
  AlertTriangle,
  Plus,
  Clock,
  Trash2,
  Loader2,
  User,
} from 'lucide-react';
import { crmInteractionsService } from '@/services/crm';
import type { CrmInteraction, InteractionType } from '@/types/crm';
import { toast } from 'sonner';

interface ClientTimelineProps {
  clientId: number;
}

const TYPE_CONFIG: Record<
  InteractionType,
  { label: string; icon: React.ReactNode; color: string; badgeClass: string }
> = {
  call: {
    label: 'Appel Téléphonique',
    icon: <Phone className="h-3.5 w-3.5" />,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-600',
  },
  visit: {
    label: 'Visite Terrain',
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  },
  whatsapp: {
    label: 'Message WhatsApp',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  },
  email: {
    label: 'E-mail',
    icon: <Mail className="h-3.5 w-3.5" />,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    badgeClass: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600',
  },
  note: {
    label: 'Note Interne',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
  },
  complaint: {
    label: 'Réclamation / SAV',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-600',
  },
};

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState<InteractionType>('call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const loadInteractions = () => {
    setLoading(true);
    crmInteractionsService
      .list({ client_id: clientId, pageSize: 50 })
      .then((res) => {
        setInteractions(res.data || []);
      })
      .catch(() => setInteractions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInteractions();
  }, [clientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre.');
      return;
    }

    setSubmitting(true);
    try {
      await crmInteractionsService.create({
        client_id: clientId,
        type,
        title: title.trim(),
        notes: notes.trim() || undefined,
        interaction_date: new Date().toISOString(),
      });
      toast.success('Échange enregistré dans la chronologie !');
      setDialogOpen(false);
      setTitle('');
      setNotes('');
      loadInteractions();
    } catch {
      toast.error('Erreur lors de l’enregistrement de l’échange.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous supprimer cet événement ?')) return;
    try {
      await crmInteractionsService.delete(id);
      toast.success('Événement supprimé.');
      loadInteractions();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  return (
    <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/40 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-bold text-foreground">
            Chronologie Relationnelle 360°
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historique complet des visites, appels, messages et notes d’échanges avec ce client.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter échange</span>
        </Button>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Chargement de la chronologie...</span>
          </div>
        ) : interactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto stroke-[1.5]" />
            <h5 className="text-xs font-bold text-foreground">Aucun échange consigné</h5>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Consignez les appels, comptes-rendus d’échanges ou notes internes pour conserver une trace partagée.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
            {interactions.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
              return (
                <div key={item.id} className="relative group">
                  {/* Dot Icon Indicator */}
                  <div
                    className={`absolute -left-6 top-0.5 p-1 rounded-full border border-background shadow-xs ${config.color}`}
                  >
                    {config.icon}
                  </div>

                  {/* Interaction Card */}
                  <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{item.title}</span>
                          <Badge className={`text-[10px] font-semibold ${config.badgeClass}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.interaction_date).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          {item.user && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <User className="h-3 w-3 text-primary" />
                              {item.user.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 rounded-md"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1 border-t border-border/30">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Dialog: New Interaction */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Consigner un échange client</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enregistrez un appel téléphonique, un message WhatsApp, un compte-rendu ou une note interne.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Canal / Type *</label>
              <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="call" className="text-xs font-medium">Appel Téléphonique</SelectItem>
                  <SelectItem value="whatsapp" className="text-xs font-medium">Message WhatsApp</SelectItem>
                  <SelectItem value="visit" className="text-xs font-medium">Visite / Rencontre</SelectItem>
                  <SelectItem value="email" className="text-xs font-medium">E-mail</SelectItem>
                  <SelectItem value="note" className="text-xs font-medium">Note Interne</SelectItem>
                  <SelectItem value="complaint" className="text-xs font-medium">Réclamation / Litige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Objet / Titre *</label>
              <Input
                placeholder="Ex: Échange sur les conditions de paiement..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Détails / Notes</label>
              <Textarea
                placeholder="Précisez le contenu de la discussion, les engagements, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-xl resize-none h-24"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl h-8 text-xs"
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Enregistrer</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
