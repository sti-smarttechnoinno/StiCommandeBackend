'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clientsService } from '@/services/clients';
import {
  Upload,
  FileSpreadsheet,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportEncaissementsDialogProps {
  onSuccess?: () => void;
  lastImportAt?: string | null;
  trigger?: React.ReactNode;
}

export function ImportEncaissementsDialog({
  onSuccess,
  lastImportAt,
  trigger,
}: ImportEncaissementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleImportLocal = async () => {
    if (!file) {
      toast.error('Veuillez d’abord choisir un fichier Excel.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await clientsService.importEncaissements(formData);
      setResult(res.data);
      toast.success(res.message || 'Importation terminée avec succès !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'importation";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportServerData = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await clientsService.importEncaissements({ use_data_folder: true });
      setResult(res.data);
      toast.success(res.message || 'Fichier data/encaissement.xlsx traité avec succès !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors du traitement";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formattedLastImport = lastImportAt
    ? format(new Date(lastImportAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Importer Encaissements</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <span>Mise à jour des Encaissements Clients</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Téléversez le fichier Excel <code className="font-mono text-foreground font-semibold">encaissement.xlsx</code> pour synchroniser et enregistrer le dernier paiement de chaque client (tiers).
          </DialogDescription>
        </DialogHeader>

        {/* Status of last update */}
        <div className="bg-muted/40 rounded-xl p-3.5 border border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>Dernière mise à jour :</span>
          </div>
          {formattedLastImport ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              {formattedLastImport}
            </Badge>
          ) : (
            <span className="text-muted-foreground italic">Aucun import récent</span>
          )}
        </div>

        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-muted/30 transition-all rounded-2xl p-6 text-center space-y-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {file ? file.name : 'Cliquez pour sélectionner encaissement.xlsx'}
            </p>
            <p className="text-xs text-muted-foreground">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} Mo` : 'Format Excel pris en charge : .xlsx, .xls'}
            </p>
          </div>
        </div>

        {/* Server Data Option */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border/60"></div>
          <span className="flex-shrink mx-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            Ou fichier serveur existant
          </span>
          <div className="flex-grow border-t border-border/60"></div>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={handleImportServerData}
          className="w-full gap-2 rounded-xl text-xs font-semibold h-10 border border-border/60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Server className="h-4 w-4 text-primary" />
          )}
          <span>Traiter le fichier <code className="font-mono text-primary font-bold">data/encaissement.xlsx</code> du serveur</span>
        </Button>

        {/* Result summary */}
        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 text-xs animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Importation terminée avec succès</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px]">Tiers traités</span>
                <span className="font-bold text-foreground text-sm">{result.tiers_count}</span>
              </div>
              <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px]">Lignes analysées</span>
                <span className="font-bold text-foreground text-sm">{result.rows_processed}</span>
              </div>
              <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px]">Clients mis à jour</span>
                <span className="font-bold text-foreground text-sm text-emerald-600">{result.clients_updated}</span>
              </div>
              <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                <span className="text-muted-foreground block text-[10px]">Nouveaux clients créés</span>
                <span className="font-bold text-foreground text-sm text-blue-600">{result.clients_created}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="m-0 mx-0 mb-0 p-4 sm:p-5 px-6 pb-6 sm:pb-7 border-t border-border/60 bg-muted/20 gap-2 sm:gap-2">
          {file && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleImportLocal}
              className="gap-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>Importer le fichier sélectionné</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-xl text-xs"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
