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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { crmVisitsService } from '@/services/crm';
import type { CrmVisit } from '@/types/crm';

interface CompleteVisitDialogProps {
  visit: CrmVisit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompleteVisitDialog({
  visit,
  open,
  onOpenChange,
  onSuccess,
}: CompleteVisitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [summary, setSummary] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas supportée par votre navigateur.');
      return;
    }
    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
        toast.success('Position GPS capturée avec succès !');
      },
      (error) => {
        setLocating(false);
        setGeoError(`Impossible de capturer la position GPS : ${error.message}`);
        toast.error('Échec de la capture GPS. Vous pouvez tout de même enregistrer le compte-rendu.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit) return;

    if (!summary.trim() || summary.trim().length < 5) {
      toast.error('Veuillez saisir un compte-rendu d’au moins 5 caractères.');
      return;
    }

    setLoading(true);
    try {
      await crmVisitsService.complete(visit.id, {
        summary: summary.trim(),
        checkin_latitude: coords?.lat ?? null,
        checkin_longitude: coords?.lng ?? null,
      });

      toast.success('Compte-rendu de visite enregistré avec succès !');
      window.dispatchEvent(new CustomEvent('sti-crm-visit-updated'));
      onOpenChange(false);
      setSummary('');
      setCoords(null);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l’enregistrement du compte-rendu.');
    } finally {
      setLoading(false);
    }
  };

  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Rapport de Visite Terrain</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Finalisez la visite pour <span className="font-semibold text-foreground">{visit.client?.name}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Visit Context Header Card */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date planifiée :</span>
            <span className="font-semibold text-foreground">
              {new Date(visit.planned_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Motif :</span>
            <span className="capitalize font-semibold text-foreground">{visit.purpose.replace('_', ' ')}</span>
          </div>
          {visit.client?.wilaya && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Localisation :</span>
              <span className="font-semibold text-foreground">{visit.client.wilaya} ({visit.client.region})</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* GPS Check-in Button */}
          <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Check-in Géolocalisation</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCaptureGps}
                disabled={locating}
                className="h-8 px-2.5 text-xs rounded-lg gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/10"
              >
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
                <span>{coords ? 'Recalculer GPS' : 'Capturer position GPS'}</span>
              </Button>
            </div>

            {coords ? (
              <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Coordonnées certifiées : {coords.lat}, {coords.lng}</span>
              </div>
            ) : geoError ? (
              <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{geoError}</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Cliquez pour enregistrer vos coordonnées géographiques et prouver le passage chez le client.
              </p>
            )}
          </div>

          {/* Compte-rendu */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Compte-rendu & Bilan de la visite *</label>
            <Textarea
              placeholder="Décrivez les échanges avec le client, les besoins exprimés, les engagements pris, les relances à prévoir..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs rounded-xl resize-none h-28"
              required
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
              className="rounded-xl h-9 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Valider le compte-rendu</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
