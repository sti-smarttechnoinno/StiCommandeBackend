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
  salesJournalService,
  SalesJournalImportPreviewResponse,
  SalesJournalImportVerifyResponse,
  SalesJournalImportExecuteResponse,
} from '@/services/sales-journal';
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
  Server,
  UserCheck,
  UserX,
  Search,
  ShoppingCart,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportSalesJournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lastImportAt?: string | null;
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
    key: 'reference',
    label: 'Référence de la pièce (N° BL / Facture)',
    required: true,
    hint: 'Numéro de document ou code de vente dans l’ERP (ex: BL26016253)',
    example: 'BL26016253',
  },
  {
    key: 'tiers_name',
    label: 'Nom du Tiers / Client',
    required: true,
    hint: 'Raison sociale du client (utilisé pour le rapprochement avec la base des clients STI)',
    example: 'SARL EST STAR',
  },
  {
    key: 'total_ttc',
    label: 'Net à payer (TTC en DA)',
    required: true,
    hint: 'Montant total TTC net à payer sur la pièce',
    example: '1 970 000.00',
  },
  {
    key: 'operation_date',
    label: 'Date de l’opération',
    required: false,
    hint: 'Date d’émission ou de validation (format date ou série numérique Excel)',
    example: '13/09/2026',
  },
  {
    key: 'amount_ht',
    label: 'Montant HT',
    required: false,
    hint: 'Total brut hors taxes',
    example: '1 970 000.00',
  },
  {
    key: 'net_ht',
    label: 'Net HT',
    required: false,
    hint: 'Net commercial hors taxes',
    example: '1 970 000.00',
  },
  {
    key: 'paid_amount',
    label: 'Paiement effectué',
    required: false,
    hint: 'Montant déjà réglé ou versé sur cette pièce',
    example: '0.00',
  },
  {
    key: 'remaining_amount',
    label: 'Reste à payer',
    required: false,
    hint: 'Solde restant dû sur la vente (calculé automatiquement si non renseigné)',
    example: '1 970 000.00',
  },
  {
    key: 'payment_mode',
    label: 'Mode de règlement',
    required: false,
    hint: 'Chèque, Espèces, Virement bancaire, etc.',
    example: 'Chèque',
  },
  {
    key: 'type',
    label: 'Type de document',
    required: false,
    hint: 'Bon de Livraison, Facture, Avoir...',
    example: 'Bon de Livraison',
  },
  {
    key: 'status',
    label: 'Statut / Validation',
    required: false,
    hint: 'Validé, Édité, En attente...',
    example: 'Validé',
  },
  {
    key: 'depot_source',
    label: 'Dépôt / Magasin source',
    required: false,
    hint: 'Dépôt d’expédition ou agence commerciale',
    example: 'Dépôt',
  },
  {
    key: 'created_by_erp',
    label: 'Créé par (ERP)',
    required: false,
    hint: 'Nom de l’opérateur ou vendeur ayant saisi la pièce dans l’ERP',
    example: 'MAHDI',
  },
];

type Step = 'upload' | 'mapping' | 'verify' | 'result';

export function ImportSalesJournalDialog({
  isOpen,
  onClose,
  onSuccess,
  lastImportAt,
}: ImportSalesJournalDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [useServerFile, setUseServerFile] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview & Verification state
  const [previewData, setPreviewData] = useState<SalesJournalImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [verifyResult, setVerifyResult] = useState<SalesJournalImportVerifyResponse | null>(null);
  const [unmatchedAction, setUnmatchedAction] = useState<'link_only' | 'create_missing'>('link_only');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip');
  const [sampleSearch, setSampleSearch] = useState('');
  const [sampleFilter, setSampleFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [executeResult, setExecuteResult] = useState<SalesJournalImportExecuteResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setUseServerFile(false);
    setPreviewData(null);
    setMapping({});
    setVerifyResult(null);
    setUnmatchedAction('link_only');
    setDuplicateAction('skip');
    setExecuteResult(null);
    setSampleSearch('');
    setSampleFilter('all');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Format non supporté. Veuillez choisir un fichier .xlsx, .xls ou .csv');
      return;
    }
    setFile(selectedFile);
    setUseServerFile(false);
  };

  const handleLoadServerFile = () => {
    setFile(null);
    setUseServerFile(true);
  };

  // Step 1 -> Step 2: Preview file
  const handleProceedToMapping = async () => {
    if (!file && !useServerFile) {
      toast.error('Veuillez sélectionner un fichier ou utiliser le fichier du serveur.');
      return;
    }

    setLoading(true);
    setLoadingText('Analyse des colonnes du fichier...');
    try {
      let preview: SalesJournalImportPreviewResponse;
      if (useServerFile) {
        preview = await salesJournalService.previewImport(undefined, '../data/jrnl_vente.xlsx');
      } else {
        preview = await salesJournalService.previewImport(file || undefined);
      }

      setPreviewData(preview);
      setMapping(preview.suggested_mapping || {});
      setStep('mapping');
      toast.success(`${preview.total_rows.toLocaleString()} lignes détectées.`);
    } catch (err: any) {
      console.error('Error previewing file:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l’analyse du fichier.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Verify and match against DB clients
  const handleProceedToVerification = async () => {
    if (!previewData?.file_token) return;
    if (!mapping.tiers_name) {
      toast.error('La colonne Tiers / Client est obligatoire pour le rapprochement.');
      return;
    }
    if (!mapping.reference) {
      toast.error('La colonne Référence est obligatoire.');
      return;
    }
    if (!mapping.total_ttc) {
      toast.error('La colonne Net à payer (TTC) est obligatoire.');
      return;
    }

    setLoading(true);
    setLoadingText('Rapprochement avec les clients du système en cours...');
    try {
      const res = await salesJournalService.verifyImport(
        previewData.file_token,
        mapping,
        unmatchedAction
      );
      setVerifyResult(res);
      setStep('verify');
      toast.success(
        `${res.matched_clients_count} clients rapprochés (${Math.round((res.matched_clients_count / Math.max(1, res.unique_tiers_count)) * 100)}%).`
      );
    } catch (err: any) {
      console.error('Error verifying import:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = async (action: 'link_only' | 'create_missing') => {
    setUnmatchedAction(action);
    if (!previewData?.file_token) return;
    try {
      const res = await salesJournalService.verifyImport(previewData.file_token, mapping, action);
      setVerifyResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Step 3 -> Step 4: Execute final import
  const handleExecuteImport = async () => {
    if (!previewData?.file_token) return;

    setLoading(true);
    setLoadingText('Enregistrement et enrichissement des ventes...');
    try {
      const res = await salesJournalService.executeImport(
        previewData.file_token,
        mapping,
        unmatchedAction,
        duplicateAction
      );
      setExecuteResult(res);
      setStep('result');
      toast.success(`Importation réussie : ${res.rows_count.toLocaleString()} ventes intégrées !`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error executing import:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l’importation.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSamples = (verifyResult?.samples || []).filter((s) => {
    if (sampleFilter === 'matched' && s.status !== 'matched') return false;
    if (sampleFilter === 'unmatched' && s.status !== 'unmatched') return false;
    if (sampleSearch.trim()) {
      const q = sampleSearch.toLowerCase();
      const tiersMatch = s.tiers_name.toLowerCase().includes(q);
      const clientMatch = s.matched_client?.name?.toLowerCase().includes(q) || false;
      const codeMatch = s.matched_client?.client_code?.toLowerCase().includes(q) || false;
      return tiersMatch || clientMatch || codeMatch;
    }
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[880px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:border-none [&_[data-slot=dialog-close]]:shadow-none [&_[data-slot=dialog-close]]:ring-0">
        {/* Header matching ImportClientsDialog */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  Importation du Journal de Vente
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider py-0.5 px-2 bg-primary/5 text-primary border-primary/30">
                    Excel / CSV
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {step === 'upload' && 'Étape 1 : Téléversez votre fichier Excel (.xlsx, .xls) ou CSV issu de votre ERP.'}
                  {step === 'mapping' && 'Étape 2 : Associez chaque colonne de votre fichier aux champs des ventes.'}
                  {step === 'verify' && 'Étape 3 : Rapprochez les clients du fichier avec les fiches clients officielles STI.'}
                  {step === 'result' && 'Rapport : Récapitulatif et confirmation des ventes intégrées.'}
                </DialogDescription>
              </div>
            </div>

            {/* Step indicator breadcrumbs matching ImportClientsDialog */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'upload' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}
              >
                1. Fichier
              </span>
              <span className="text-muted-foreground/40 text-[10px]">→</span>
              <span
                className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'mapping' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}
              >
                2. Mappage
              </span>
              <span className="text-muted-foreground/40 text-[10px]">→</span>
              <span
                className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'verify' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}
              >
                3. Rapprochement
              </span>
              <span className="text-muted-foreground/40 text-[10px]">→</span>
              <span
                className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'result' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}
              >
                4. Résultat
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Notice Banner matching ImportClientsDialog */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Importation guidée et sécurisée de votre journal de vente :</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground pl-6">
                  <div>
                    <strong className="text-foreground">1. Fichier :</strong> Déposez votre tableur Excel ou CSV issu de votre ERP.
                  </div>
                  <div>
                    <strong className="text-foreground">2. Mappage :</strong> Faites correspondre Référence, Client, Montants et Dates.
                  </div>
                  <div>
                    <strong className="text-foreground">3. Rapprochement :</strong> Réconciliation automatique avec vos clients STI.
                  </div>
                </div>
              </div>

              {/* Mandatory Notice */}
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Critères minimaux obligatoires :</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Votre fichier doit contenir au minimum les colonnes <strong className="text-foreground">Référence de la pièce</strong>, <strong className="text-foreground">Nom du Tiers / Client</strong> et <strong className="text-foreground">Net à payer (TTC)</strong>.
                </p>
              </div>

              {/* Quick option: Use server preloaded file */}
              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Fichier ERP disponible sur le serveur</p>
                    <p className="text-[11px] text-muted-foreground">data/jrnl_vente.xlsx (9 913 ventes enregistrées)</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={useServerFile ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLoadServerFile}
                  className="gap-1.5 rounded-lg h-8 text-xs font-semibold"
                >
                  <Server className="w-3.5 h-3.5" />
                  {useServerFile ? 'Fichier Sélectionné' : 'Utiliser ce fichier'}
                </Button>
              </div>

              {/* Dropzone matching ImportClientsDialog */}
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
                    : (file || useServerFile)
                    ? 'border-emerald-500 bg-emerald-50/10'
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
                  ) : file || useServerFile ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-primary" />
                  )}
                </div>

                <div className="space-y-1">
                  {file ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Taille : {(file.size / (1024 * 1024)).toFixed(2)} Mo • Prêt pour le mappage des colonnes
                      </p>
                    </>
                  ) : useServerFile ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">Fichier serveur : data/jrnl_vente.xlsx</p>
                      <p className="text-xs text-muted-foreground">
                        9 913 lignes prêtes pour intégration rapide
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        {loading
                          ? 'Analyse et lecture du fichier en cours...'
                          : 'Glissez-déposez votre fichier Excel ou CSV ici'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ou <span className="text-primary font-medium underline underline-offset-2">parcourez vos dossiers</span> pour choisir (.xlsx, .xls, .csv)
                      </p>
                    </>
                  )}
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
                    Max 50 Mo
                  </Badge>
                </div>
              </div>

              {lastImportAt && (
                <p className="text-xs text-muted-foreground text-center">
                  Dernier import effectué le : <span className="font-semibold text-foreground">{lastImportAt}</span>
                </p>
              )}
            </div>
          )}

          {/* STEP 2: MAPPING matching ImportClientsDialog */}
          {step === 'mapping' && previewData && (
            <div className="space-y-6">
              {/* Information banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Pré-association automatique effectuée. </span>
                  <span className="text-muted-foreground">
                    Vérifiez la correspondance de chaque champ avec la colonne de votre fichier. Le rapprochement avec les clients du système STI sera effectué à l&apos;étape suivante.
                  </span>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    Association des colonnes du fichier
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Fichier : <span className="font-medium text-foreground">{previewData.file_name}</span> ({previewData.total_rows.toLocaleString()} lignes)
                  </span>
                </div>

                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
                  {TARGET_FIELDS.map((field) => {
                    const selectedCol = mapping[field.key] || '';
                    const isMandatory = field.required;
                    const isValid = !isMandatory || Boolean(selectedCol);
                    const matchedCol = previewData.columns.find((c) => c.key === selectedCol);

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

                        <div className="flex flex-col sm:items-end gap-1 w-full sm:w-72 shrink-0">
                          <div className="relative w-full">
                            <select
                              value={selectedCol}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMapping((prev) => ({ ...prev, [field.key]: val }));
                              }}
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

                          {matchedCol && matchedCol.sample && (
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-full">
                              Ex: <span className="text-foreground">{matchedCol.sample}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION & RECONCILIATION */}
          {step === 'verify' && verifyResult && (
            <div className="space-y-6">
              {/* Summary 4-grid Cards matching ImportClientsDialog */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-xs text-muted-foreground font-medium">Total Pièces</span>
                  <p className="text-xl font-bold text-foreground mt-1">{verifyResult.total_rows.toLocaleString()}</p>
                  <span className="text-[11px] text-muted-foreground">{verifyResult.unique_tiers_count} clients uniques</span>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">Reconnus STI</span>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {verifyResult.matched_clients_count}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
                    {Math.round((verifyResult.matched_clients_count / Math.max(1, verifyResult.unique_tiers_count)) * 100)}% de couverture
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 dark:text-amber-400 font-medium">Non Identifiés</span>
                    <UserX className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {verifyResult.unmatched_clients_count}
                  </p>
                  <span className="text-[11px] text-amber-600 dark:text-amber-500">Tiers non présents en base</span>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10">
                  <span className="text-xs text-blue-800 dark:text-blue-400 font-medium">Chiffre d’Affaires TTC</span>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1 truncate">
                    {verifyResult.total_ttc.toLocaleString('fr-FR')} DA
                  </p>
                  <span className="text-[11px] text-blue-600 dark:text-blue-500 truncate block">
                    Reste dû : {verifyResult.total_remaining.toLocaleString('fr-FR')} DA
                  </span>
                </div>
              </div>

              {/* Duplicate Strategy and Warning */}
              {verifyResult.existing_duplicates_count > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {verifyResult.existing_duplicates_count.toLocaleString()} vente(s) avec une référence déjà existante dans le système STI ont été détectées.
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      Veuillez choisir ci-dessous comment vous souhaitez traiter ces doublons lors de l&apos;intégration finale.
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicate Policy Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    Traitement des doublons ({verifyResult.existing_duplicates_count} existants détectés) :
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Option: Skip */}
                  <div
                    onClick={() => setDuplicateAction('skip')}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 flex flex-col justify-between',
                      duplicateAction === 'skip'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border/70 hover:border-border bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        Ignorer les doublons (Skip)
                        <Badge variant="outline" className="text-[9px] font-medium text-primary border-primary/30 bg-primary/10">
                          Recommandé
                        </Badge>
                      </span>
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center',
                          duplicateAction === 'skip' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}
                      >
                        {duplicateAction === 'skip' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Préserve les ventes déjà enregistrées sans modification. Les pièces existantes ne seront pas réimportées, évitant ainsi tout risque de doublons.
                    </p>
                  </div>

                  {/* Option: Update */}
                  <div
                    onClick={() => setDuplicateAction('update')}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 flex flex-col justify-between',
                      duplicateAction === 'update'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border/70 hover:border-border bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Mettre à jour les ventes existantes (Update)
                      </span>
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center',
                          duplicateAction === 'update' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}
                      >
                        {duplicateAction === 'update' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Actualise les montants (HT, TVA, TTC), règlements, dates et statuts de chaque vente existante avec les nouvelles valeurs du fichier.
                    </p>
                  </div>
                </div>
              </div>

              {/* Unmatched client policy radio cards */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Politique pour les tiers non reconnus ({verifyResult.unmatched_clients_count}) :
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => handleActionChange('link_only')}
                    className={cn(
                      'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all bg-card',
                      unmatchedAction === 'link_only'
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'border-border/60 hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="unmatched_action"
                      checked={unmatchedAction === 'link_only'}
                      onChange={() => handleActionChange('link_only')}
                      className="mt-0.5 text-primary"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Conserver le nom sans créer de client</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        (Recommandé) Enregistre les ventes avec le nom d&apos;origine sans modifier ni ajouter de nouvelle fiche client STI.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => handleActionChange('create_missing')}
                    className={cn(
                      'p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all bg-card',
                      unmatchedAction === 'create_missing'
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'border-border/60 hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="unmatched_action"
                      checked={unmatchedAction === 'create_missing'}
                      onChange={() => handleActionChange('create_missing')}
                      className="mt-0.5 text-primary"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Créer les clients manquants</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Génère une nouvelle fiche client STI avec code automatique pour chaque tiers non identifié.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sample reconciliation table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Aperçu de la réconciliation (Échantillon)
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative w-48">
                      <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Rechercher client..."
                        value={sampleSearch}
                        onChange={(e) => setSampleSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1 rounded-lg border bg-background"
                      />
                    </div>
                    <div className="flex rounded-lg border bg-background p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setSampleFilter('all')}
                        className={cn('px-2 py-0.5 rounded text-[11px]', sampleFilter === 'all' && 'bg-primary text-primary-foreground font-semibold')}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleFilter('matched')}
                        className={cn('px-2 py-0.5 rounded text-[11px]', sampleFilter === 'matched' && 'bg-emerald-600 text-white font-semibold')}
                      >
                        Reconnus
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleFilter('unmatched')}
                        className={cn('px-2 py-0.5 rounded text-[11px]', sampleFilter === 'unmatched' && 'bg-amber-600 text-white font-semibold')}
                      >
                        Inconnus
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-card text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/40 border-b sticky top-0 font-bold text-muted-foreground text-[11px]">
                      <tr>
                        <th className="p-2.5 px-3">Tiers du Fichier</th>
                        <th className="p-2.5">Statut</th>
                        <th className="p-2.5">Client Système STI</th>
                        <th className="p-2.5">Délégué / Wilaya</th>
                        <th className="p-2.5 text-right">Nb Pièces</th>
                        <th className="p-2.5 text-right px-3">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredSamples.slice(0, 30).map((s, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 px-3 font-semibold text-foreground">{s.tiers_name}</td>
                          <td className="p-2.5">
                            {s.status === 'matched' ? (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Reconnu
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                Inconnu
                              </Badge>
                            )}
                          </td>
                          <td className="p-2.5">
                            {s.matched_client ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">{s.matched_client.name}</span>
                                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                  {s.matched_client.client_code}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">Non lié</span>
                            )}
                          </td>
                          <td className="p-2.5 text-muted-foreground text-[11px]">
                            {s.matched_client ? (
                              <span>
                                {s.matched_client.delegate || 'Non assigné'} • {s.matched_client.wilaya || '-'}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-2.5 text-right font-medium">{s.operations_count}</td>
                          <td className="p-2.5 text-right px-3 font-bold font-mono text-foreground">
                            {s.total_ttc.toLocaleString('fr-FR')} DA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT / RAPPORT */}
          {step === 'result' && executeResult && (
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Journal de Vente Intégré avec Succès !</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Toutes les ventes ont été enregistrées et reliées aux clients, wilayas, régions et délégués de votre système.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-4 text-left">
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground font-medium">Ventes Traitées</span>
                  <p className="text-lg font-bold text-foreground mt-1">{executeResult.rows_count.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">Clients Liés</span>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">{executeResult.matched_clients_count}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                    {executeResult.duplicate_action === 'skip' ? 'Doublons Ignorés' : 'Doublons Mis à Jour'}
                  </span>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">
                    {executeResult.duplicate_action === 'skip' ? executeResult.skipped_duplicates_count : executeResult.updated_duplicates_count}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/10">
                  <span className="text-[11px] text-primary font-medium">Durée</span>
                  <p className="text-lg font-bold text-primary mt-1">{executeResult.duration_seconds} s</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer matching ImportClientsDialog with comfortable spacing */}
        <DialogFooter className="m-0 mx-0 mb-0 p-5 sm:p-6 px-6 sm:px-8 pb-6 sm:pb-8 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between w-full shrink-0">
          {step === 'upload' && (
            <div className="flex items-center justify-between w-full gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="rounded-lg h-9 px-4 text-xs font-semibold"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                disabled={(!file && !useServerFile) || loading}
                onClick={handleProceedToMapping}
                className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Continuer vers le mappage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'mapping' && (
            <div className="flex items-center justify-between w-full gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={loading}
                className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Changer de fichier</span>
              </Button>
              <Button
                size="sm"
                disabled={loading}
                onClick={handleProceedToVerification}
                className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Vérifier la réconciliation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="flex items-center justify-between w-full gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('mapping')}
                disabled={loading}
                className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Modifier le mappage</span>
              </Button>
              <Button
                size="sm"
                disabled={loading}
                onClick={handleExecuteImport}
                className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Confirmer et lancer l&apos;importation ({verifyResult?.total_rows.toLocaleString()} ventes)</span>
                    <Check className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'result' && (
            <div className="flex items-center justify-between w-full gap-4">
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
  );
}
