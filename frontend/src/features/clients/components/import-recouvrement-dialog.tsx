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
  UploadCloud,
  FileSpreadsheet,
  Coins,
  Server,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Check,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserPlus,
  ArrowRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createMissing, setCreateMissing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !loading) {
      setFile(null);
      setResult(null);
      setIsDragOver(false);
    }
  };

  const handleFileSelect = (selected: File) => {
    const ext = selected.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv)');
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImportLocal = async () => {
    if (!file) {
      toast.error('Veuillez d’abord choisir un fichier.');
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
          className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span>Mettre à jour les soldes</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[840px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:border-none [&_[data-slot=dialog-close]]:shadow-none [&_[data-slot=dialog-close]]:ring-0">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    Mise à jour des soldes clients (Recouvrement)
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider py-0.5 px-2 bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/30">
                      Recouvrement
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {result
                      ? 'Rapport de synchronisation des soldes et créances clients.'
                      : 'Importez votre fichier de recouvrement pour faire correspondre automatiquement les noms et actualiser les soldes.'}
                  </DialogDescription>
                </div>
              </div>

              {/* Status indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors',
                    !result
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'text-muted-foreground bg-muted/60'
                  )}
                >
                  1. Rapprochement
                </span>
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors',
                    result
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-muted-foreground bg-muted/60'
                  )}
                >
                  2. Résultat & Soldes
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto flex-1 max-h-[calc(92vh-140px)] space-y-6">
            {!result ? (
              <>
                {/* Information Notice */}
                <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Rapprochement automatique intelligent des noms :</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                    Le système identifie automatiquement les colonnes de votre fichier (<strong className="text-foreground">Libellé / Nom</strong> et <strong className="text-foreground">Solde / Impayé</strong>) et fait correspondre les clients avec votre base de données en harmonisant les accents, majuscules et mentions annexes.
                  </p>
                </div>

                {/* Option: Create missing clients */}
                <div className="bg-muted/40 rounded-xl p-3.5 border border-border/60 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <label htmlFor="create-missing" className="font-semibold text-foreground cursor-pointer block">
                      Créer les nouveaux clients manquants
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Si activé, les clients présents dans le fichier qui n’existent pas encore seront automatiquement ajoutés avec leur solde initial.
                    </p>
                  </div>
                  <Checkbox
                    id="create-missing"
                    checked={createMissing}
                    onCheckedChange={(checked) => setCreateMissing(Boolean(checked))}
                  />
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3',
                    isDragOver
                      ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                      : 'border-border/80 hover:border-amber-500/60 hover:bg-muted/30 bg-card'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-amber-500" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {loading
                        ? 'Traitement et mise à jour des soldes en cours...'
                        : file
                        ? file.name
                        : 'Glissez-déposez votre fichier de recouvrement ici'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file
                        ? `${(file.size / 1024 / 1024).toFixed(2)} Mo — Cliquez pour changer de fichier`
                        : 'ou parcourez vos dossiers pour choisir (.xlsx, .xls, .csv)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Excel (.xlsx)
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Excel 97-2003 (.xls)
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      CSV (.csv)
                    </Badge>
                  </div>
                </div>

                {/* Selected File Card */}
                {file && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} Mo
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border/60"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Ou utiliser le fichier serveur
                  </span>
                  <div className="flex-grow border-t border-border/60"></div>
                </div>

                {/* Server Option Button */}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={handleImportServerData}
                  className="w-full gap-2 rounded-xl text-xs font-semibold h-11 border border-border/60 bg-muted/60 hover:bg-muted cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  ) : (
                    <Server className="h-4 w-4 text-amber-500" />
                  )}
                  <span>
                    Traiter directement le fichier{' '}
                    <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      data/recouvrement.xlsx
                    </code>
                  </span>
                </Button>
              </>
            ) : (
              /* RESULTS VIEW */
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Success Banner */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Rapprochement et mise à jour terminés avec succès !</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Les soldes ont été synchronisés et enregistrés dans la base de données.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                    Terminé
                  </Badge>
                </div>

                {/* 4 KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-card shadow-xs">
                    <span className="text-muted-foreground block text-[11px] font-medium">Lignes traitées</span>
                    <span className="font-bold text-foreground text-lg">{result.total_rows}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-medium">Clients mis à jour</span>
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{result.clients_updated}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 dark:text-blue-400 block text-[11px] font-medium">Nouveaux créés</span>
                      <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{result.clients_created}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-600 dark:text-rose-400 block text-[11px] font-medium">Avec impayé</span>
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-lg">{result.clients_with_debt}</span>
                  </div>
                </div>

                {/* Total Balance Card */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/70 font-mono">
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground font-sans block">Total créances & soldes impayés :</span>
                    <span className="text-[11px] text-muted-foreground/70 font-sans">
                      Fichier : {result.file_name}
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                    {Number(result.total_outstanding || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </div>

                {/* Matched samples list */}
                {result.matched_samples && result.matched_samples.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Exemples de clients synchronisés
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {result.matched_samples.length} aperçus
                      </span>
                    </div>
                    <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40 bg-card">
                      {result.matched_samples.map((s: any, i: number) => (
                        <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate max-w-sm">{s.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {s.code && (
                                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                  {s.code}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground font-normal">
                                {s.match_type === 'code' ? 'Par code' : s.match_type === 'exact_name' ? 'Nom exact' : 'Nom harmonisé'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                            <span className="text-muted-foreground line-through text-[11px]">
                              {Number(s.old_solde || 0).toLocaleString('fr-FR')} DA
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                            <span className={cn(
                              'font-bold',
                              s.new_solde > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            )}>
                              {Number(s.new_solde || 0).toLocaleString('fr-FR')} DA
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 sm:px-6 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-3">
            {!result ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl text-xs"
                >
                  Annuler
                </Button>
                {file && (
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleImportLocal}
                    className="gap-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                    <span>Mettre à jour les soldes</span>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Importer un autre fichier</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                >
                  Terminer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
