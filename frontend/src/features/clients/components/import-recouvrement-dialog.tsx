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
import { Checkbox } from '@/components/ui/checkbox';
import { clientsService } from '@/services/clients';
import {
  Upload,
  Coins,
  Server,
  CheckCircle2,
  Loader2,
  Clock,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportRecouvrementDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ImportRecouvrementDialog({
  onSuccess,
  trigger,
}: ImportRecouvrementDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [createMissing, setCreateMissing] = useState(true);
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
      formData.append('create_missing', createMissing ? '1' : '0');
      const res = await clientsService.importRecouvrement(formData);
      setResult(res.data);
      toast.success(res.message || 'Soldes de recouvrement importés avec succès !');
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
      const res = await clientsService.importRecouvrement({
        use_data_folder: true,
        create_missing: createMissing,
      });
      setResult(res.data);
      toast.success(res.message || 'Fichier data/recouvrement.xlsx traité avec succès !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors du traitement";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Soldes Recouvrement</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Coins className="h-5 w-5 text-amber-500" />
              <span>Importation des Soldes Clients (Recouvrement)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mettez à jour les <strong>soldes impayés et créances</strong> de chaque client en important le fichier <code className="font-mono text-foreground font-semibold">recouvrement.xlsx</code>.
            </DialogDescription>
          </DialogHeader>

          {/* Option: Create missing clients */}
          <div className="bg-muted/40 rounded-xl p-3.5 border border-border/60 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <label htmlFor="create-missing" className="font-semibold text-foreground cursor-pointer block">
                Créer les nouveaux clients manquants
              </label>
              <p className="text-[11px] text-muted-foreground">
                Si un client présent dans le fichier n’existe pas encore dans la base, l’enregistrer automatiquement.
              </p>
            </div>
            <Checkbox
              id="create-missing"
              checked={createMissing}
              onCheckedChange={(checked) => setCreateMissing(Boolean(checked))}
            />
          </div>

          {/* Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-border/80 hover:border-amber-500/60 hover:bg-muted/30 transition-all rounded-2xl p-6 text-center space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {file ? file.name : 'Cliquez pour sélectionner recouvrement.xlsx'}
              </p>
              <p className="text-xs text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} Mo` : 'Format Excel accepté : .xlsx, .xls'}
              </p>
            </div>
          </div>

          {/* Server Data Option */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border/60"></div>
            <span className="flex-shrink mx-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Ou importer directement depuis le serveur
            </span>
            <div className="flex-grow border-t border-border/60"></div>
          </div>

          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={handleImportServerData}
            className="w-full gap-2 rounded-xl text-xs font-semibold h-10 border border-border/60 bg-muted/60 hover:bg-muted"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            ) : (
              <Server className="h-4 w-4 text-amber-500" />
            )}
            <span>Traiter le fichier <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">data/recouvrement.xlsx</code></span>
          </Button>

          {/* Result summary */}
          {result && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5 text-xs animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Synchronisation des soldes terminée</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Lignes traitées</span>
                  <span className="font-bold text-foreground text-sm">{result.total_rows}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Clients mis à jour</span>
                  <span className="font-bold text-emerald-600 text-sm">{result.clients_updated}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Clients créés</span>
                  <span className="font-bold text-blue-600 text-sm">{result.clients_created}</span>
                </div>
                <div className="bg-background/80 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">Avec impayé</span>
                  <span className="font-bold text-rose-600 text-sm">{result.clients_with_debt}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-background/90 rounded-lg border border-border/40 font-mono text-xs">
                <span className="text-muted-foreground">Total créances / impayés :</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                  {Number(result.total_outstanding || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="m-0 mx-0 mb-0 p-4 sm:p-5 px-6 pb-6 sm:pb-7 border-t border-border/60 bg-muted/20 gap-2 sm:gap-2">
            {file && (
              <Button
                type="button"
                disabled={loading}
                onClick={handleImportLocal}
                className="gap-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
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
