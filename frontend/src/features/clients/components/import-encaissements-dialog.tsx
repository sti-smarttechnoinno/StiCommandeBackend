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
import { Input } from '@/components/ui/input';
import {
  encaissementsService,
  EncaissementImportPreviewResponse,
  EncaissementImportVerificationResult,
  EncaissementImportResult,
} from '@/services/encaissements';
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
  Wallet,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ImportEncaissementsDialogProps {
  onSuccess?: () => void;
  lastImportAt?: string | null;
  trigger?: React.ReactNode;
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
    key: 'tiers_name',
    label: 'Nom du Tiers / Client',
    required: true,
    hint: 'Raison sociale ou dénomination du tiers (utilisé pour vérifier l’existence en base)',
    example: 'SARL EST STAR',
  },
  {
    key: 'payment_date',
    label: 'Date de paiement / opération',
    required: false,
    hint: 'Date de la transaction financière (numérique Excel ou texte)',
    example: '15/09/2026',
  },
  {
    key: 'credit',
    label: 'Montant Crédit / Encaissement (DZD)',
    required: false,
    hint: 'Montant crédité / versé par le client',
    example: '500 000.00',
  },
  {
    key: 'debit',
    label: 'Montant Débit / Décaissement (DZD)',
    required: false,
    hint: 'Montant débité / sortie de caisse',
    example: '50 000.00',
  },
  {
    key: 'order_number',
    label: 'N° Ordre / Pièce comptable',
    required: false,
    hint: 'Numéro séquentiel ou référence de la pièce',
    example: '20305',
  },
  {
    key: 'payment_mode',
    label: 'Mode de règlement',
    required: false,
    hint: 'Espèces, Chèque, Virement, Traite...',
    example: 'Espèces',
  },
  {
    key: 'account',
    label: 'Compte / Caisse / Banque',
    required: false,
    hint: 'Caisse centrale, Compte BNA, etc.',
    example: 'caisse',
  },
  {
    key: 'reference',
    label: 'Référence / N° Chèque',
    required: false,
    hint: 'Numéro du chèque, bordereau ou référence bancaire',
    example: 'CHQ-98451',
  },
  {
    key: 'label',
    label: 'Libellé / Description',
    required: false,
    hint: 'Description ou objet du versement',
    example: 'Règlement facture client',
  },
  {
    key: 'type',
    label: 'Type d’opération',
    required: false,
    hint: 'Encaissement ou Décaissement',
    example: 'Encaissement',
  },
];

type Step = 'upload' | 'mapping' | 'verify' | 'result';

export function ImportEncaissementsDialog({
  onSuccess,
  lastImportAt,
  trigger,
}: ImportEncaissementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isServerFile, setIsServerFile] = useState(false);
  const [previewData, setPreviewData] = useState<EncaissementImportPreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [unmatchedAction, setUnmatchedAction] = useState<'link_only' | 'create' | 'skip'>('link_only');

  // Verification & Execution state
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [verificationData, setVerificationData] = useState<EncaissementImportVerificationResult | null>(null);
  const [result, setResult] = useState<EncaissementImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [verifyTab, setVerifyTab] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [verifySearch, setVerifySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setIsServerFile(false);
    setPreviewData(null);
    setMapping({});
    setUnmatchedAction('link_only');
    setLoading(false);
    setVerifying(false);
    setExecuting(false);
    setVerificationData(null);
    setResult(null);
    setVerifyTab('all');
    setVerifySearch('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (executing || verifying || loading)) {
      toast.warning('Opération en cours, veuillez patienter...');
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
    if (f.size > 30 * 1024 * 1024) {
      toast.error('Le fichier dépasse la taille maximale autorisée (30 Mo)');
      return false;
    }
    return true;
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;
    setFile(selectedFile);
    setIsServerFile(false);
    await processPreview(selectedFile);
  };

  const handleSelectServerFile = async () => {
    setFile(null);
    setIsServerFile(true);
    await processPreview({ use_data_folder: true });
  };

  const processPreview = async (fileOrOption: File | { use_data_folder: boolean }) => {
    setLoading(true);
    try {
      const data = await encaissementsService.previewImport(fileOrOption);
      setPreviewData(data);
      setMapping(data.suggested_mapping || {});
      setStep('mapping');
      toast.success(`${data.total_rows.toLocaleString()} lignes détectées avec succès`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'analyse du fichier";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (targetKey: string, fileCol: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (!fileCol || fileCol === '__skip__') {
        delete next[targetKey];
      } else {
        next[targetKey] = fileCol;
      }
      return next;
    });
  };

  const canProceedFromMapping = () => {
    return Boolean(mapping['tiers_name']);
  };

  const handleGoToVerification = async () => {
    if (!previewData) return;
    if (!mapping['tiers_name']) {
      toast.error("Veuillez sélectionner la colonne correspondant au 'Nom du Tiers / Client'");
      return;
    }

    setVerifying(true);
    try {
      const data = await encaissementsService.verifyImport({
        file_token: previewData.file_token,
        mapping,
        unmatched_action: unmatchedAction,
      });
      setVerificationData(data);
      setStep('verify');
      toast.info(
        `Vérification terminée : ${data.matched_clients_count} clients reconnus, ${data.unmatched_clients_count} non trouvés.`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la vérification des clients';
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;
    setExecuting(true);
    try {
      const res = await encaissementsService.executeImport({
        file_token: previewData.file_token,
        mapping,
        unmatched_action: unmatchedAction,
      });
      setResult(res.data);
      setStep('result');
      toast.success(res.message || 'Importation terminée avec succès !');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'importation finale";
      toast.error(msg);
    } finally {
      setExecuting(false);
    }
  };

  const formattedLastImport = lastImportAt
    ? format(new Date(lastImportAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
    : null;

  // Filtered samples in verification step
  const filteredSamples = (verificationData?.samples || []).filter((s) => {
    if (verifyTab === 'matched' && s.status !== 'matched') return false;
    if (verifyTab === 'unmatched' && s.status !== 'unmatched') return false;
    if (verifySearch.trim()) {
      const q = verifySearch.toLowerCase();
      const matchName = s.matched_client?.name?.toLowerCase() || '';
      const matchCode = s.matched_client?.client_code?.toLowerCase() || '';
      return s.tiers_name.toLowerCase().includes(q) || matchName.includes(q) || matchCode.includes(q);
    }
    return true;
  });

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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-4xl max-w-4xl bg-card border-border/80 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Mise à jour des Encaissements Clients
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Importez et synchronisez le journal des encaissements et les derniers paiements clients.
                  </DialogDescription>
                </div>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    step === 'upload'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  1. Fichier
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    step === 'mapping'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  2. Mappage
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    step === 'verify'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  3. Vérification Clients
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full font-semibold transition-all',
                    step === 'result'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  4. Bilan
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)] space-y-6">
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Last Update Info Box */}
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span>Dernière mise à jour du journal :</span>
                  </div>
                  {formattedLastImport ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                      {formattedLastImport}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground italic">Aucun import récent</span>
                  )}
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
                    'cursor-pointer border-2 border-dashed rounded-3xl p-8 text-center space-y-4 transition-all duration-200',
                    isDragOver
                      ? 'border-primary bg-primary/5 scale-[0.99]'
                      : 'border-border/80 hover:border-primary/60 hover:bg-muted/20'
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

                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <UploadCloud className="h-8 w-8" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">
                      {loading
                        ? 'Analyse du fichier en cours...'
                        : 'Déposez votre fichier d’encaissements ici ou cliquez pour parcourir'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Formats acceptés : <strong className="text-foreground">Excel (.xlsx, .xls)</strong> ou{' '}
                      <strong className="text-foreground">CSV (.csv)</strong> jusqu’à 30 Mo.
                    </p>
                  </div>
                </div>

                {/* Or Server File Option */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border/60"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                    Ou utiliser le fichier présent sur le serveur
                  </span>
                  <div className="flex-grow border-t border-border/60"></div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Fichier local : <code className="font-mono text-primary font-bold">data/encaissement.xlsx</code>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Traiter directement le fichier serveur contenant l’historique des opérations de paiement.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={handleSelectServerFile}
                    className="gap-2 rounded-xl text-xs font-bold h-9 px-4 shrink-0 bg-card hover:bg-muted/70 shadow-2xs"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-primary" />
                    )}
                    <span>Charger ce fichier</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: MAPPING */}
            {step === 'mapping' && previewData && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* File info banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Fichier : {previewData.file_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-background/80 font-bold border-emerald-500/30">
                      {previewData.total_rows.toLocaleString()} lignes au total
                    </Badge>
                    <Badge variant="outline" className="bg-background/80 font-bold border-emerald-500/30">
                      {previewData.columns.length} colonnes détectées
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Associer les colonnes du fichier aux champs cibles
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les colonnes ont été pré-remplies automatiquement. Vous pouvez ajuster chaque correspondance ci-dessous.
                  </p>
                </div>

                {/* Fields Mapping Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {TARGET_FIELDS.map((field) => {
                    const currentMapping = mapping[field.key] || '';
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all text-xs space-y-2',
                          field.required && !currentMapping
                            ? 'border-amber-500/40 bg-amber-500/5'
                            : currentMapping
                            ? 'border-border/80 bg-card shadow-2xs'
                            : 'border-border/40 bg-muted/10 opacity-80'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>{field.label}</span>
                            {field.required ? (
                              <span className="text-rose-500 text-xs font-bold" title="Champ obligatoire">
                                *
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-normal">(Optionnel)</span>
                            )}
                          </div>
                          {currentMapping && (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-mono">
                              Col {currentMapping}
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-1">{field.hint}</p>

                        <select
                          value={currentMapping}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          <option value="">-- Ignorer ce champ --</option>
                          {previewData.columns.map((col) => (
                            <option key={col.key} value={col.key}>
                              Colonne {col.key} : {col.label} {col.sample ? `(Ex: ${col.sample})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Sample Live Preview Table */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Aperçu des 3 premières lignes avec votre mappage
                  </h4>
                  <div className="border border-border/60 rounded-2xl overflow-x-auto bg-card shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="p-2.5 font-bold">Tiers</th>
                          <th className="p-2.5 font-bold">Date</th>
                          <th className="p-2.5 font-bold text-right">Crédit (DA)</th>
                          <th className="p-2.5 font-bold text-right">Débit (DA)</th>
                          <th className="p-2.5 font-bold">N° Ordre</th>
                          <th className="p-2.5 font-bold">Mode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {previewData.preview_rows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2.5 font-bold text-foreground">
                              {mapping['tiers_name'] ? row[mapping['tiers_name']] || '—' : '—'}
                            </td>
                            <td className="p-2.5 text-muted-foreground">
                              {mapping['payment_date'] ? row[mapping['payment_date']] || '—' : '—'}
                            </td>
                            <td className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                              {mapping['credit'] ? row[mapping['credit']] || '0.00' : '—'}
                            </td>
                            <td className="p-2.5 text-right font-extrabold text-rose-600 dark:text-rose-400">
                              {mapping['debit'] ? row[mapping['debit']] || '0.00' : '—'}
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground">
                              {mapping['order_number'] ? row[mapping['order_number']] || '—' : '—'}
                            </td>
                            <td className="p-2.5 text-muted-foreground">
                              {mapping['payment_mode'] ? row[mapping['payment_mode']] || '—' : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFY CLIENTS EXISTENCE */}
            {step === 'verify' && verificationData && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* 4 KPIs Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Lignes
                    </span>
                    <span className="text-xl font-extrabold text-foreground mt-0.5 block">
                      {verificationData.total_rows.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {verificationData.unique_tiers_count} tiers distincts
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        Clients Reconnus
                      </span>
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      {verificationData.matched_clients_count}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
                      Trouvés dans la base
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                        Clients Non Trouvés
                      </span>
                      <UserX className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 block">
                      {verificationData.unmatched_clients_count}
                    </span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
                      Absents de la base
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Encaissé
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate" title={`${verificationData.total_credit.toLocaleString()} DA`}>
                      {verificationData.total_credit.toLocaleString()} DA
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Débit : {verificationData.total_debit.toLocaleString()} DA
                    </span>
                  </div>
                </div>

                {/* Missing Clients Handling Choice */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Que faire avec les tiers non trouvés en base ({verificationData.unmatched_clients_count}) ?</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <label
                      className={cn(
                        'flex flex-col p-3 rounded-xl border cursor-pointer transition-all',
                        unmatchedAction === 'link_only'
                          ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-2xs'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="unmatchedAction"
                          value="link_only"
                          checked={unmatchedAction === 'link_only'}
                          onChange={() => setUnmatchedAction('link_only')}
                          className="text-primary"
                        />
                        <span className="font-bold text-foreground">Lier aux existants uniquement (Recommandé)</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 ml-5">
                        Tous les encaissements sont importés dans le journal. Seuls les clients reconnus reçoivent leur lien.
                      </span>
                    </label>

                    <label
                      className={cn(
                        'flex flex-col p-3 rounded-xl border cursor-pointer transition-all',
                        unmatchedAction === 'create'
                          ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-2xs'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="unmatchedAction"
                          value="create"
                          checked={unmatchedAction === 'create'}
                          onChange={() => setUnmatchedAction('create')}
                          className="text-primary"
                        />
                        <span className="font-bold text-foreground">Créer les clients manquants</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 ml-5">
                        Crée automatiquement une fiche client (code auto CLT-XXXXX) pour chaque tiers absent.
                      </span>
                    </label>

                    <label
                      className={cn(
                        'flex flex-col p-3 rounded-xl border cursor-pointer transition-all',
                        unmatchedAction === 'skip'
                          ? 'border-primary bg-primary/5 font-semibold text-foreground shadow-2xs'
                          : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="unmatchedAction"
                          value="skip"
                          checked={unmatchedAction === 'skip'}
                          onChange={() => setUnmatchedAction('skip')}
                          className="text-primary"
                        />
                        <span className="font-bold text-foreground">Ignorer les non trouvés</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 ml-5">
                        N’importe que les encaissements dont le client existe déjà dans la base.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Samples and Search */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerifyTab('all')}
                        className={cn(
                          'h-7 px-3 rounded-lg text-xs font-semibold',
                          verifyTab === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                        )}
                      >
                        Tous ({verificationData.samples.length})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerifyTab('matched')}
                        className={cn(
                          'h-7 px-3 rounded-lg text-xs font-semibold',
                          verifyTab === 'matched' ? 'bg-card text-emerald-600 shadow-xs' : 'text-muted-foreground'
                        )}
                      >
                        Reconnus ({verificationData.matched_clients_count})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerifyTab('unmatched')}
                        className={cn(
                          'h-7 px-3 rounded-lg text-xs font-semibold',
                          verifyTab === 'unmatched' ? 'bg-card text-amber-600 shadow-xs' : 'text-muted-foreground'
                        )}
                      >
                        Non trouvés ({verificationData.unmatched_clients_count})
                      </Button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher un tiers..."
                        value={verifySearch}
                        onChange={(e) => setVerifySearch(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Table of matched samples */}
                  <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-2xs max-h-[260px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground sticky top-0 border-b border-border/40 z-10">
                        <tr>
                          <th className="p-2.5 font-bold">Tiers dans le fichier</th>
                          <th className="p-2.5 font-bold">Statut & Correspondance en base</th>
                          <th className="p-2.5 font-bold text-center">Opérations</th>
                          <th className="p-2.5 font-bold text-right">Total Crédit (DA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredSamples.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">
                              Aucun tiers correspondant aux critères de recherche.
                            </td>
                          </tr>
                        ) : (
                          filteredSamples.slice(0, 50).map((s, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="p-2.5 font-bold text-foreground">
                                {s.tiers_name}
                              </td>
                              <td className="p-2.5">
                                {s.status === 'matched' && s.matched_client ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 text-[10px] font-semibold">
                                      <CheckCircle2 className="h-3 w-3" /> Trouvé
                                    </Badge>
                                    <span className="font-semibold text-foreground">
                                      {s.matched_client.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                      ({s.matched_client.client_code})
                                    </span>
                                    {s.matched_client.wilaya && (
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        • {s.matched_client.wilaya}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[10px] font-semibold">
                                    <AlertCircle className="h-3 w-3" /> Absent de la base
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2.5 text-center font-bold text-muted-foreground">
                                {s.operations_count}
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                {s.total_credit.toLocaleString()} DA
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 'result' && result && (
              <div className="space-y-6 py-4 animate-in fade-in-50 duration-200">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    Importation des encaissements réussie !
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Le journal financier et les correspondances clients ont été mis à jour avec succès en {result.duration_seconds}s.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-card border border-border/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Encaissements Enregistrés
                    </span>
                    <span className="text-2xl font-extrabold text-foreground mt-1 block">
                      {result.encaissements_imported.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                      Clients Liés
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {result.clients_matched.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                      Clients Créés
                    </span>
                    <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                      {result.clients_created.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 text-center shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Crédité
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
                      {result.total_amount_credited.toLocaleString()} DA
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="p-4 sm:p-5 px-6 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2">
            <div>
              {step === 'mapping' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('upload')}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Changer de fichier
                </Button>
              )}
              {step === 'verify' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('mapping')}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Modifier le mappage
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step === 'upload' && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Annuler
                </Button>
              )}

              {step === 'mapping' && (
                <Button
                  type="button"
                  disabled={!canProceedFromMapping() || verifying}
                  onClick={handleGoToVerification}
                  className="gap-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs px-5"
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>Vérifier les clients</span>
                </Button>
              )}

              {step === 'verify' && (
                <Button
                  type="button"
                  disabled={executing}
                  onClick={handleExecuteImport}
                  className="gap-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-6"
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Lancer l’importation</span>
                </Button>
              )}

              {step === 'result' && (
                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (onSuccess) onSuccess();
                  }}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground px-6"
                >
                  Terminer & Fermer
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
