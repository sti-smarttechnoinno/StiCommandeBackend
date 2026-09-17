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
import {
  clientsService,
  ClientImportPreviewResponse,
  ClientImportResult,
} from '@/services/clients';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Users,
  Check,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportClientsDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  buttonLabel?: string;
}

interface TargetField {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  example?: string;
}

const TARGET_FIELDS: TargetField[] = [
  {
    key: 'name',
    label: 'Nom du client',
    required: true,
    hint: 'Raison sociale, nom et prénom ou dénomination commerciale',
    example: 'Ets Pharmacie Centrale',
  },
  {
    key: 'phone',
    label: 'Numéro de téléphone',
    required: true,
    hint: 'Numéro de contact principal (utilisé aussi pour la détection des doublons)',
    example: '0550 12 34 56',
  },
  {
    key: 'client_code',
    label: 'Code client',
    required: false,
    hint: 'Identifiant unique (laissé vide, un code CLI-2026-XXXXXX sera auto-généré)',
    example: 'CLI-2026-000145',
  },
  {
    key: 'wilaya',
    label: 'Wilaya',
    required: false,
    hint: 'Wilaya d’implantation (permet de déduire la région automatiquement)',
    example: 'Alger, Oran, Constantine...',
  },
  {
    key: 'region',
    label: 'Région',
    required: false,
    hint: 'Zone géographique (Centre, Ouest, Est, Sud)',
    example: 'Centre',
  },
  {
    key: 'address',
    label: 'Adresse',
    required: false,
    hint: 'Adresse physique ou localisation',
    example: '12 Boulevard des Martyrs, Bab El Oued',
  },
  {
    key: 'client_type',
    label: 'Type de client',
    required: false,
    hint: 'Classification (retail, wholesale, corporate, government)',
    example: 'wholesale / Grossiste',
  },
  {
    key: 'credit_limit',
    label: 'Plafond de crédit (DZD)',
    required: false,
    hint: 'Limite de crédit autorisée en Dinars',
    example: '500000',
  },
  {
    key: 'outstanding_balance',
    label: 'Solde en cours (DZD)',
    required: false,
    hint: 'Dette initiale ou encours client à l’importation',
    example: '25000',
  },
];

type Step = 'upload' | 'mapping' | 'result';

export function ImportClientsDialog({
  onSuccess,
  trigger,
  buttonLabel = 'Import',
}: ImportClientsDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ClientImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<'update' | 'skip'>('update');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ClientImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setMapping({});
    setDuplicateAction('update');
    setLoading(false);
    setExecuting(false);
    setResult(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && executing) {
      toast.warning('Importation en cours, veuillez patienter...');
      return;
    }
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetState, 300);
    }
  };

  const validateFile = (f: File): boolean => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = f.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      toast.error('Format non supporté. Veuillez téléverser un fichier Excel (.xlsx, .xls) ou CSV (.csv)');
      return false;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error('Le fichier dépasse la taille maximale autorisée (25 Mo)');
      return false;
    }
    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    setFile(selectedFile);
    processPreview(selectedFile);
  };

  const processPreview = async (fileToPreview: File) => {
    setLoading(true);
    try {
      const data = await clientsService.importPreview(fileToPreview);
      setPreviewData(data);
      // Initialize mapping with suggested mapping or blank
      const initialMap: Record<string, string> = {};
      TARGET_FIELDS.forEach((f) => {
        initialMap[f.key] = data.suggested_mapping[f.key] || '';
      });
      setMapping(initialMap);
      setStep('mapping');
      toast.success(`Fichier analysé avec succès : ${data.total_rows} lignes et ${data.columns.length} colonnes détectées.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'analyse du fichier";
      toast.error(msg);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (fieldKey: string, colKey: string) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: colKey,
    }));
  };

  const canExecute = () => {
    return Boolean(mapping.name && mapping.phone);
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;
    if (!mapping.name || !mapping.phone) {
      toast.error('Veuillez mapper au moins les deux champs obligatoires : Nom du client et Téléphone.');
      return;
    }

    setExecuting(true);
    try {
      const res = await clientsService.importExecute({
        file_token: previewData.file_token,
        mapping,
        duplicate_action: duplicateAction,
      });

      setResult(res.data);
      setStep('result');
      toast.success(res.message || 'Importation terminée avec succès !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'exécution de l'importation";
      toast.error(msg);
    } finally {
      setExecuting(false);
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
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          <span>{buttonLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[780px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-border shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    Importation de Clients
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider py-0.5 px-2 bg-primary/5 text-primary border-primary/30">
                      Excel / CSV
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {step === 'upload' && 'Sélectionnez un fichier pour démarrer l’importation de clients.'}
                    {step === 'mapping' && 'Identifiez les colonnes et configurez la stratégie de doublons.'}
                    {step === 'result' && 'Rapport d’importation et récapitulatif des opérations.'}
                  </DialogDescription>
                </div>
              </div>

              {/* Step indicator breadcrumbs */}
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'upload' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  1. Fichier
                </span>
                <span className="text-muted-foreground/50">→</span>
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'mapping' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  2. Mappage
                </span>
                <span className="text-muted-foreground/50">→</span>
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'result' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  3. Résultat
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-6">
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <div className="space-y-5">
                {/* Mandatory Notice Banner */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Critères obligatoires pour l&apos;importation :</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground pl-6">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive shrink-0 animate-pulse" />
                      <span><strong className="text-foreground">Nom du client</strong> <span className="text-destructive font-bold">(* Obligatoire)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive shrink-0 animate-pulse" />
                      <span><strong className="text-foreground">Téléphone</strong> <span className="text-destructive font-bold">(* Obligatoire)</span></span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 pl-6">
                    Les autres colonnes (Code client, Wilaya, Région, Type, Limites de crédit...) sont entièrement optionnelles et seront déduites automatiquement si non renseignées.
                  </p>
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
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-card'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-primary" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {loading
                        ? 'Analyse du fichier en cours...'
                        : 'Glissez-déposez votre fichier Excel ou CSV ici'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou <span className="text-primary font-medium underline underline-offset-2">parcourez vos dossiers</span> pour sélectionner un fichier (.xlsx, .xls, .csv)
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
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Max 25 Mo
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: MAPPING & DUPLICATES */}
            {step === 'mapping' && previewData && (
              <div className="space-y-6">
                {/* Information banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Mappage intelligent automatique activé. </span>
                    <span className="text-muted-foreground">
                      Le système a pré-associé vos colonnes selon leurs en-têtes. Vérifiez que chaque champ correspond bien à votre fichier avant de continuer.
                    </span>
                  </div>
                </div>

                {/* Column Mapping Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      Identification des colonnes
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      Fichier : <span className="font-medium text-foreground">{file?.name}</span> ({previewData.total_rows} lignes)
                    </span>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
                    {TARGET_FIELDS.map((field) => {
                      const selectedCol = mapping[field.key] || '';
                      const isMandatory = field.required;
                      const isValid = !isMandatory || Boolean(selectedCol);

                      return (
                        <div
                          key={field.key}
                          className={cn(
                            'p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                            !isValid ? 'bg-destructive/5' : 'hover:bg-muted/20'
                          )}
                        >
                          <div className="space-y-0.5 max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {field.label}
                              </span>
                              {isMandatory ? (
                                <Badge variant="destructive" className="text-[9px] font-bold px-1.5 py-0 uppercase tracking-wider bg-destructive text-destructive-foreground">
                                  * Obligatoire
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground px-1.5 py-0">
                                  Optionnel
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {field.hint}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-64 shrink-0">
                            <div className="relative w-full">
                              <select
                                value={selectedCol}
                                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                className={cn(
                                  'w-full h-9 rounded-lg border bg-background px-3 pr-8 text-xs font-medium appearance-none transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30',
                                  isMandatory && !selectedCol
                                    ? 'border-destructive text-destructive ring-1 ring-destructive/40'
                                    : 'border-input text-foreground hover:border-primary/50'
                                )}
                              >
                                <option value="">
                                  {isMandatory ? '-- Sélectionner la colonne (* Obligatoire) --' : '-- Ignorer / Ne pas importer --'}
                                </option>
                                {previewData.columns.map((col) => (
                                  <option key={col.key} value={col.key}>
                                    Colonne {col.key} : {col.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duplicate Strategy Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Gestion des doublons (Correspondance par nom ou téléphone)
                    </h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Option: Update */}
                    <div
                      onClick={() => setDuplicateAction('update')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1.5 flex flex-col justify-between',
                        duplicateAction === 'update'
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border/70 hover:border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          Mettre à jour si existant
                          <Badge variant="outline" className="text-[9px] font-medium text-primary border-primary/30 bg-primary/10">
                            Recommandé
                          </Badge>
                        </span>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center',
                          duplicateAction === 'update' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}>
                          {duplicateAction === 'update' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Si un client avec le même nom ou téléphone existe déjà, met à jour son adresse, sa wilaya et ses coordonnées avec les données de l’Excel.
                      </p>
                    </div>

                    {/* Option: Skip */}
                    <div
                      onClick={() => setDuplicateAction('skip')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-1.5 flex flex-col justify-between',
                        duplicateAction === 'skip'
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border/70 hover:border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Ignorer les doublons
                        </span>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center',
                          duplicateAction === 'skip' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}>
                          {duplicateAction === 'skip' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Ne modifie aucun client existant. Seuls les nouveaux clients introuvables en base seront ajoutés.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview sample rows */}
                {previewData.preview_rows.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Aperçu des 5 premières lignes du fichier :
                    </span>
                    <div className="border border-border/80 rounded-xl overflow-x-auto bg-card shadow-2xs max-h-48">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                            <th className="px-3 py-2 border-r border-border/60">Ligne</th>
                            {previewData.columns.map((c) => (
                              <th key={c.key} className="px-3 py-2 whitespace-nowrap border-r border-border/60 last:border-r-0">
                                <span className="text-primary font-bold">{c.key}</span> : {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-foreground">
                          {previewData.preview_rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="px-3 py-1.5 text-muted-foreground font-mono text-[11px] bg-muted/20 border-r border-border/60">
                                #{idx + 2}
                              </td>
                              {previewData.columns.map((c) => (
                                <td key={c.key} className="px-3 py-1.5 whitespace-nowrap max-w-[160px] truncate border-r border-border/60 last:border-r-0">
                                  {row[c.key] || <span className="text-muted-foreground/40 italic">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 'result' && result && (
              <div className="space-y-6 py-2">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Importation terminée !
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Le fichier a été traité avec succès. Vos clients sont désormais synchronisés dans la base de données.
                  </p>
                </div>

                {/* KPI stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-border bg-card text-center space-y-1">
                    <span className="text-[11px] text-muted-foreground">Lignes traitées</span>
                    <p className="text-xl font-bold text-foreground font-mono">
                      {result.total_rows}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-1">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Nouveaux créés</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{result.created_count}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center space-y-1">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Mis à jour</span>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {result.updated_count}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-1">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Doublons ignorés</span>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {result.skipped_count}
                    </p>
                  </div>
                </div>

                {/* Errors display if any */}
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-xs">
                    <div className="flex items-center gap-2 text-destructive font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{result.errors_count} ligne(s) non importée(s) :</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-destructive/90 pr-2">
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="font-bold">Ligne {err.line} :</span>
                          <span>{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <DialogFooter className="m-0 mx-0 mb-0 p-4 sm:p-5 px-6 pb-6 sm:pb-7 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between w-full shrink-0">
            {step === 'upload' && (
              <div className="flex items-center justify-end gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  Annuler
                </Button>
              </div>
            )}

            {step === 'mapping' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('upload')}
                  disabled={executing}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Retour</span>
                </Button>

                <div className="flex items-center gap-2">
                  {!canExecute() && (
                    <span className="text-[11px] text-destructive font-medium hidden sm:inline-block">
                      * Nom et Téléphone obligatoires
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!canExecute() || executing}
                    onClick={handleExecuteImport}
                    className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Importation en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Lancer l&apos;importation</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Nouvel import</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-lg h-9 px-6 text-xs font-bold bg-primary text-primary-foreground"
                >
                  Fermer
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
