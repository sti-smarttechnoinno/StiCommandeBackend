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
  ClientImportVerificationResult,
  ClientImportResult,
  WilayaExtractResponse,
  WilayaFileItem,
  DbWilayaItem,
  RegionExtractResponse,
  RegionFileItem,
  DbRegionItem,
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
  UserCheck,
  UserPlus,
  ShieldAlert,
  MapPin,
  Globe,
  Search,
  Zap,
  FileText,
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
    label: 'Nom du client / Raison sociale',
    required: true,
    hint: 'Raison sociale, nom et prénom ou dénomination commerciale',
    example: 'Ets Pharmacie Centrale',
  },
  {
    key: 'phone',
    label: 'Numéro de Téléphone Personnel',
    required: true,
    hint: 'Numéro personnel ou principal du client (utilisé pour la détection des doublons)',
    example: '0550 12 34 56',
  },
  {
    key: 'storm_phone',
    label: 'Numéro STORM (Ooredoo Flexy)',
    required: false,
    hint: 'Ligne de rechargement ou puce Storm Ooredoo (si présente dans votre fichier)',
    example: '0557 99 88 77',
  },
  {
    key: 'rc_number',
    label: 'N° Registre de Commerce (RC)',
    required: false,
    hint: 'Numéro d\'immatriculation au registre du commerce algérien (ex: 16/00-0123456B19)',
    example: '16/00-0123456B19',
  },
  {
    key: 'client_code',
    label: 'Code client',
    required: false,
    hint: 'Code identifiant unique (si vide, code séquentiel CLI-2026-XXXXXX auto-généré)',
    example: 'CLI-2026-000145',
  },
  {
    key: 'wilaya',
    label: 'Wilaya',
    required: false,
    hint: 'Wilaya de rattachement (vous pourrez faire correspondre chaque valeur aux 58 wilayas officielles)',
    example: 'Alger, Oran, Constantine...',
  },
  {
    key: 'region',
    label: 'Région commerciale',
    required: false,
    hint: 'Zone géographique (déduite automatiquement de la Wilaya choisie si non spécifiée)',
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
    hint: 'Classification (retail / détail, wholesale / gros, corporate, government)',
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
    label: 'Solde en cours initial (DZD)',
    required: false,
    hint: 'Encours ou dette client initiale',
    example: '25000',
  },
];

type Step = 'upload' | 'mapping' | 'wilayas' | 'regions' | 'verify' | 'result';

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
  
  // Wilaya reconciliation state
  const [extractingWilayas, setExtractingWilayas] = useState(false);
  const [wilayaExtractData, setWilayaExtractData] = useState<WilayaExtractResponse | null>(null);
  const [wilayaMapping, setWilayaMapping] = useState<Record<string, string>>({});
  const [wilayaSearch, setWilayaSearch] = useState('');

  // Region reconciliation state
  const [extractingRegions, setExtractingRegions] = useState(false);
  const [regionExtractData, setRegionExtractData] = useState<RegionExtractResponse | null>(null);
  const [regionMapping, setRegionMapping] = useState<Record<string, string>>({});
  const [regionSearch, setRegionSearch] = useState('');

  // Verification & Execution state
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [verificationData, setVerificationData] = useState<ClientImportVerificationResult | null>(null);
  const [result, setResult] = useState<ClientImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setMapping({});
    setDuplicateAction('update');
    setExtractingWilayas(false);
    setWilayaExtractData(null);
    setWilayaMapping({});
    setWilayaSearch('');
    setExtractingRegions(false);
    setRegionExtractData(null);
    setRegionMapping({});
    setRegionSearch('');
    setLoading(false);
    setVerifying(false);
    setExecuting(false);
    setVerificationData(null);
    setResult(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (executing || verifying || extractingWilayas || extractingRegions)) {
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
      // Initialize mapping with suggested mapping or empty string
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

  const canProceedFromMapping = () => {
    return Boolean(mapping.name && (mapping.phone || mapping.personal_phone));
  };

  /**
   * Called when finishing Step 2 (Mapping).
   * If a Wilaya column was mapped, extracts distinct wilayas and goes to Step 3 (Wilayas).
   * Otherwise goes directly to Step 4 (Verify).
   */
  const handleProceedFromMapping = async () => {
    if (!previewData) return;
    if (mapping.personal_phone && !mapping.phone) {
      mapping.phone = mapping.personal_phone;
    }
    if (!mapping.name || !mapping.phone) {
      toast.error('Veuillez mapper au moins les deux champs obligatoires : Nom du client et Téléphone.');
      return;
    }

    if (mapping.wilaya) {
      // Extract distinct wilayas from the file
      setExtractingWilayas(true);
      try {
        const wilayaData = await clientsService.extractWilayas({
          file_token: previewData.file_token,
          wilaya_column: mapping.wilaya,
        });
        setWilayaExtractData(wilayaData);

        // Pre-fill wilayaMapping with matched names
        const initialWilayaMap: Record<string, string> = {};
        wilayaData.distinct_wilayas.forEach((item) => {
          initialWilayaMap[item.file_value] = item.matched_wilaya_name || 'Alger';
        });
        setWilayaMapping(initialWilayaMap);
        setStep('wilayas');
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Erreur lors de l'extraction des wilayas";
        toast.error(msg);
      } finally {
        setExtractingWilayas(false);
      }
    } else if (mapping.region) {
      await handleExtractRegions(true);
    } else {
      // Skip reconciliation and proceed straight to verify
      handleProceedToVerification({}, {});
    }
  };

  const handleExtractRegions = async (goToStep = true) => {
    if (!previewData || !mapping.region) return;
    setExtractingRegions(true);
    try {
      const regionData = await clientsService.extractRegions({
        file_token: previewData.file_token,
        region_column: mapping.region,
      });
      setRegionExtractData(regionData);

      // Pre-fill regionMapping with matched names
      const initialRegionMap: Record<string, string> = {};
      regionData.distinct_regions.forEach((item) => {
        initialRegionMap[item.file_value] = item.matched_region_name || (regionData.db_regions[0]?.name || 'Centre');
      });
      setRegionMapping((prev) => ({ ...initialRegionMap, ...prev }));
      if (goToStep) {
        setStep('regions');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'extraction des régions";
      toast.error(msg);
    } finally {
      setExtractingRegions(false);
    }
  };

  const handleProceedFromWilayas = async () => {
    if (mapping.region) {
      if (regionExtractData) {
        setStep('regions');
      } else {
        await handleExtractRegions(true);
      }
    } else {
      handleProceedToVerification(wilayaMapping, regionMapping);
    }
  };

  const handleWilayaItemChange = (fileValue: string, dbWilayaName: string) => {
    setWilayaMapping((prev) => ({
      ...prev,
      [fileValue]: dbWilayaName,
    }));
  };

  const handleRegionItemChange = (fileValue: string, dbRegionName: string) => {
    setRegionMapping((prev) => ({
      ...prev,
      [fileValue]: dbRegionName,
    }));
  };

  const handleResetWilayaSuggestions = () => {
    if (!wilayaExtractData) return;
    const initialWilayaMap: Record<string, string> = {};
    wilayaExtractData.distinct_wilayas.forEach((item) => {
      initialWilayaMap[item.file_value] = item.matched_wilaya_name || 'Alger';
    });
    setWilayaMapping(initialWilayaMap);
    toast.info('Suggestions de Wilayas réinitialisées.');
  };

  const handleResetRegionSuggestions = () => {
    if (!regionExtractData) return;
    const initialRegionMap: Record<string, string> = {};
    regionExtractData.distinct_regions.forEach((item) => {
      initialRegionMap[item.file_value] = item.matched_region_name || (regionExtractData.db_regions[0]?.name || 'Centre');
    });
    setRegionMapping(initialRegionMap);
    toast.info('Suggestions de Régions réinitialisées.');
  };

  const handleSetAllUnmatchedToAlger = () => {
    if (!wilayaExtractData) return;
    const updated: Record<string, string> = { ...wilayaMapping };
    wilayaExtractData.distinct_wilayas.forEach((item) => {
      if (!updated[item.file_value] || item.confidence === 'none') {
        updated[item.file_value] = 'Alger';
      }
    });
    setWilayaMapping(updated);
    toast.success('Valeurs non reconnues définies sur Alger.');
  };

  /**
   * Proceed to Verification Step using current mapping, wilayaMapping, and regionMapping.
   */
  const handleProceedToVerification = async (
    activeWilayaMap = wilayaMapping,
    activeRegionMap = regionMapping
  ) => {
    if (!previewData) return;
    setVerifying(true);
    try {
      const vData = await clientsService.importVerify({
        file_token: previewData.file_token,
        mapping,
        duplicate_action: duplicateAction,
        wilaya_mapping: activeWilayaMap,
        region_mapping: activeRegionMap,
      });
      setVerificationData(vData);
      setStep('verify');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de la vérification des doublons";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleDuplicateActionChange = (newAction: 'update' | 'skip') => {
    setDuplicateAction(newAction);
    if (verificationData) {
      setVerificationData({
        ...verificationData,
        duplicate_action: newAction,
        to_update_count: newAction === 'update' ? verificationData.existing_clients_count : 0,
        to_skip_count: newAction === 'skip' ? verificationData.existing_clients_count : 0,
        sample_verifications: verificationData.sample_verifications.map((s) => {
          if (s.status === 'existing') {
            return {
              ...s,
              action: newAction === 'update' ? 'update' : 'skip',
            };
          }
          return s;
        }),
      });
    }
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
        wilaya_mapping: wilayaMapping,
        region_mapping: regionMapping,
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

  // Filtered distinct wilayas for search in step 'wilayas'
  const filteredWilayaItems = (wilayaExtractData?.distinct_wilayas || []).filter((item) => {
    if (!wilayaSearch.trim()) return true;
    const q = wilayaSearch.toLowerCase();
    const mapped = (wilayaMapping[item.file_value] || '').toLowerCase();
    return item.file_value.toLowerCase().includes(q) || mapped.includes(q);
  });

  // Filtered distinct regions for search in step 'regions'
  const filteredRegionItems = (regionExtractData?.distinct_regions || []).filter((item) => {
    if (!regionSearch.trim()) return true;
    const q = regionSearch.toLowerCase();
    const mapped = (regionMapping[item.file_value] || '').toLowerCase();
    return item.file_value.toLowerCase().includes(q) || mapped.includes(q);
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
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          <span>{buttonLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[880px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:border-none [&_[data-slot=dialog-close]]:shadow-none [&_[data-slot=dialog-close]]:ring-0">
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
                    {step === 'upload' && 'Étape 1 : Téléversez votre fichier Excel (.xlsx, .xls) ou CSV.'}
                    {step === 'mapping' && 'Étape 2 : Associez chaque colonne de votre fichier aux champs clients.'}
                    {step === 'wilayas' && 'Étape 3 : Faites correspondre les Wilayas écrites dans votre fichier avec celles de la base de données.'}
                    {step === 'regions' && 'Étape 4 : Faites correspondre les Régions écrites dans votre fichier avec les régions officielles.'}
                    {step === 'verify' && 'Vérification : Vérifiez les nouveaux clients, détection de doublons et mise à jour.'}
                    {step === 'result' && 'Rapport : Rapport d’importation et récapitulatif des opérations.'}
                  </DialogDescription>
                </div>
              </div>

              {/* Step indicator breadcrumbs */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'upload' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  1. Fichier
                </span>
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'mapping' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  2. Mappage
                </span>
                {Boolean(mapping.wilaya) && (
                  <>
                    <span className="text-muted-foreground/40 text-[10px]">→</span>
                    <span className={cn(
                      'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                      step === 'wilayas' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                    )}>
                      3. Wilayas
                    </span>
                  </>
                )}
                {Boolean(mapping.region) && (
                  <>
                    <span className="text-muted-foreground/40 text-[10px]">→</span>
                    <span className={cn(
                      'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                      step === 'regions' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                    )}>
                      {mapping.wilaya ? '4. Régions' : '3. Régions'}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'verify' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  {Boolean(mapping.wilaya) && Boolean(mapping.region) ? '5. Vérification' : (Boolean(mapping.wilaya) || Boolean(mapping.region) ? '4. Vérification' : '3. Vérification')}
                </span>
                <span className="text-muted-foreground/40 text-[10px]">→</span>
                <span className={cn(
                  'px-2 py-1 rounded-md font-medium text-[11px] transition-colors',
                  step === 'result' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-muted-foreground bg-muted/60'
                )}>
                  {Boolean(mapping.wilaya) && Boolean(mapping.region) ? '6. Résultat' : (Boolean(mapping.wilaya) || Boolean(mapping.region) ? '5. Résultat' : '4. Résultat')}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-8 space-y-6">
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <div className="space-y-5">
                {/* Notice Banner */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Importation guidée et sécurisée de vos clients :</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground pl-6">
                    <div>
                      <strong className="text-foreground">1. Fichier :</strong> Déposez votre tableur Excel ou CSV.
                    </div>
                    <div>
                      <strong className="text-foreground">2. Mappage :</strong> Choisissez quelle colonne correspond à chaque donnée.
                    </div>
                    <div>
                      <strong className="text-foreground">3. Wilayas & Doublons :</strong> Normalisez les wilayas et contrôlez les doublons.
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
                    Votre fichier doit contenir au minimum les colonnes <strong className="text-foreground">Nom du client</strong> et <strong className="text-foreground">Numéro de téléphone</strong>. Les wilayas écrites sous différentes formes seront automatiquement harmonisées avec celles de la base.
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
                        ? 'Analyse et lecture du fichier en cours...'
                        : 'Glissez-déposez votre fichier Excel ou CSV ici'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ou <span className="text-primary font-medium underline underline-offset-2">parcourez vos dossiers</span> pour choisir (.xlsx, .xls, .csv)
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

            {/* STEP 2: MAPPING */}
            {step === 'mapping' && previewData && (
              <div className="space-y-6">
                {/* Information banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Pré-association automatique effectuée. </span>
                    <span className="text-muted-foreground">
                      Vérifiez que chaque champ correspond à la bonne colonne de votre fichier. Si vous mappez la colonne Wilaya, vous pourrez harmoniser ses différentes valeurs à l&apos;étape suivante.
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
                      Fichier : <span className="font-medium text-foreground">{file?.name}</span> ({previewData.total_rows} lignes)
                    </span>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
                    {TARGET_FIELDS.map((field) => {
                      const selectedCol = mapping[field.key] || '';
                      const isMandatory = field.required;
                      const isValid = !isMandatory || Boolean(selectedCol);

                      // Find sample value if column selected
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

                            {/* Sample value preview */}
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

                {/* Preview raw sample rows */}
                {previewData.preview_rows.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Aperçu des 5 premières lignes du fichier brut :
                    </span>
                    <div className="border border-border/80 rounded-xl overflow-x-auto bg-card shadow-2xs max-h-44">
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

            {/* STEP 3: WILAYAS RECONCILIATION */}
            {step === 'wilayas' && wilayaExtractData && (
              <div className="space-y-5">
                {/* Header info banner */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>Harmonisation et correspondance des Wilayas :</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {wilayaExtractData.distinct_wilayas.length} valeurs différentes trouvées
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Les wilayas écrites dans votre tableur (ex: <span className="font-mono text-foreground font-bold">16</span>, <span className="font-mono text-foreground font-bold">ALGER</span>, <span className="font-mono text-foreground font-bold">W. Blida</span>, <span className="font-mono text-foreground font-bold">Tizi</span>) peuvent différer de la base. Associez chaque valeur brute à la wilaya officielle correspondante. La région commerciale et le délégué seront appliqués automatiquement.
                  </p>
                </div>

                {/* Toolbar: Search + Quick Fill */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filtrer une valeur ou wilaya..."
                      value={wilayaSearch}
                      onChange={(e) => setWilayaSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetWilayaSuggestions}
                      className="h-8 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Réinitialiser
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetAllUnmatchedToAlger}
                      className="h-8 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Non-reconnues ➔ Alger
                    </Button>
                  </div>
                </div>

                {/* Wilaya Matching Table */}
                <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border/60">
                  <div className="p-3 bg-muted/40 font-semibold text-[11px] text-muted-foreground grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5 sm:col-span-4">Valeur écrite dans le fichier</div>
                    <div className="col-span-7 sm:col-span-5">Wilaya officielle en base de données</div>
                    <div className="hidden sm:block sm:col-span-3 text-right">Région & Précision</div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                    {filteredWilayaItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        Aucune valeur ne correspond à votre recherche.
                      </div>
                    ) : (
                      filteredWilayaItems.map((item) => {
                        const currentSelected = wilayaMapping[item.file_value] || item.matched_wilaya_name || 'Alger';
                        const matchedDbWilaya = wilayaExtractData.db_wilayas.find((w) => w.name === currentSelected);

                        return (
                          <div
                            key={item.file_value}
                            className="p-3 sm:px-4 grid grid-cols-12 gap-3 items-center hover:bg-muted/20 transition-colors"
                          >
                            {/* File Value & count */}
                            <div className="col-span-5 sm:col-span-4 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold font-mono text-foreground truncate max-w-[170px]" title={item.file_value}>
                                  &ldquo;{item.file_value}&rdquo;
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                <span className="font-semibold text-primary">{item.count}</span> client(s) dans le fichier
                              </div>
                            </div>

                            {/* DB Wilaya selector */}
                            <div className="col-span-7 sm:col-span-5">
                              <div className="relative">
                                <select
                                  value={currentSelected}
                                  onChange={(e) => handleWilayaItemChange(item.file_value, e.target.value)}
                                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 pr-7 text-xs font-medium text-foreground appearance-none shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  {wilayaExtractData.db_wilayas.map((w) => (
                                    <option key={w.id} value={w.name}>
                                      {w.code} - {w.name} ({w.region_name})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>

                            {/* Region & Match indicator */}
                            <div className="hidden sm:flex sm:col-span-3 items-center justify-end gap-2">
                              {matchedDbWilaya && (
                                <Badge variant="secondary" className="text-[10px] font-normal py-0">
                                  {matchedDbWilaya.region_name}
                                </Badge>
                              )}
                              {item.confidence === 'exact' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                  Exact
                                </Badge>
                              )}
                              {item.confidence === 'auto' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                  Détecté
                                </Badge>
                              )}
                              {item.confidence === 'none' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                  À vérifier
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3b / 4: REGIONS RECONCILIATION */}
            {step === 'regions' && regionExtractData && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span>Harmonisation et correspondance des Régions commerciales :</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {regionExtractData.distinct_regions.length} valeurs différentes trouvées
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Les régions écrites dans votre tableur peuvent différer des désignations officielles. Associez chaque valeur brute à la région officielle correspondante pour garantir une affectation et un suivi précis.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filtrer une valeur ou région..."
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetRegionSuggestions}
                      className="h-8 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border/60">
                  <div className="p-3 bg-muted/40 font-semibold text-[11px] text-muted-foreground grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5 sm:col-span-4">Valeur écrite dans le fichier</div>
                    <div className="col-span-7 sm:col-span-5">Région officielle en base de données</div>
                    <div className="hidden sm:block sm:col-span-3 text-right">Précision</div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                    {filteredRegionItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        Aucune valeur ne correspond à votre recherche.
                      </div>
                    ) : (
                      filteredRegionItems.map((item) => {
                        const currentSelected = regionMapping[item.file_value] || item.matched_region_name || (regionExtractData.db_regions[0]?.name || 'Centre');
                        const matchedDbRegion = regionExtractData.db_regions.find((r) => r.name === currentSelected);

                        return (
                          <div
                            key={item.file_value}
                            className="p-3 sm:px-4 grid grid-cols-12 gap-3 items-center hover:bg-muted/20 transition-colors"
                          >
                            <div className="col-span-5 sm:col-span-4 space-y-0.5">
                              <span className="text-xs font-bold font-mono text-foreground truncate max-w-[170px]" title={item.file_value}>
                                &ldquo;{item.file_value}&rdquo;
                              </span>
                              <div className="text-[10px] text-muted-foreground">
                                <span className="font-semibold text-primary">{item.count}</span> client(s) dans le fichier
                              </div>
                            </div>

                            <div className="col-span-7 sm:col-span-5">
                              <div className="relative">
                                <select
                                  value={currentSelected}
                                  onChange={(e) => handleRegionItemChange(item.file_value, e.target.value)}
                                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 pr-7 text-xs font-medium text-foreground appearance-none shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  {regionExtractData.db_regions.map((r) => (
                                    <option key={r.id} value={r.name}>
                                      {r.icon || '🗺️'} {r.name} ({r.code})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>

                            <div className="hidden sm:flex sm:col-span-3 items-center justify-end gap-2">
                              {matchedDbRegion && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: matchedDbRegion.color || '#2563EB' }}
                                  title={matchedDbRegion.name}
                                />
                              )}
                              {item.confidence === 'exact' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                  Exact
                                </Badge>
                              )}
                              {item.confidence === 'auto' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                  Détecté
                                </Badge>
                              )}
                              {item.confidence === 'none' && (
                                <Badge variant="outline" className="text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                  À vérifier
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: VERIFICATION & DUPLICATES */}
            {step === 'verify' && verificationData && (
              <div className="space-y-6">
                {/* Header Summary */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Résultats de l’audit de vérification
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Analyse comparative avec application de votre mappage de colonnes et de wilayas.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {verificationData.total_rows} lignes scannées
                    </Badge>
                  </div>

                  {/* Audit Counters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Nouveaux clients</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        +{verificationData.new_clients_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Créations nettes</p>
                    </div>

                    <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Clients existants</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {verificationData.existing_clients_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Doublons détectés</p>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                      <span className="text-[11px] text-foreground font-semibold">Action prévue</span>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        {duplicateAction === 'update' ? verificationData.to_update_count : verificationData.to_skip_count}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {duplicateAction === 'update' ? 'Seront mis à jour' : 'Seront ignorés'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Lignes invalides</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {verificationData.invalid_rows}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Nom/tél manquant</p>
                    </div>
                  </div>
                </div>

                {/* Duplicate Policy Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Stratégie de gestion des doublons existants
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Option: Update */}
                    <div
                      onClick={() => handleDuplicateActionChange('update')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 flex flex-col justify-between',
                        duplicateAction === 'update'
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border/70 hover:border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          Mettre à jour si existant (Update)
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
                        Pour les <strong className="text-foreground">{verificationData.existing_clients_count} client(s) existant(s)</strong>, met à jour leurs coordonnées, adresse, wilaya et solde avec les données du fichier Excel.
                      </p>
                    </div>

                    {/* Option: Skip */}
                    <div
                      onClick={() => handleDuplicateActionChange('skip')}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all space-y-2 flex flex-col justify-between',
                        duplicateAction === 'skip'
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border/70 hover:border-border bg-card'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Ignorer les doublons (Skip)
                        </span>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center',
                          duplicateAction === 'skip' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}>
                          {duplicateAction === 'skip' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Ne modifie aucun client existant. Seuls les <strong className="text-foreground">{verificationData.new_clients_count} nouveaux clients</strong> seront enregistrés.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sample Verification Live Audit Table */}
                {verificationData.sample_verifications.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        Tableau d&apos;échantillon vérifié ({verificationData.sample_verifications.length} premières lignes) :
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Match par Code client, Téléphone, N° STORM ou Nom
                      </span>
                    </div>

                    <div className="border border-border/80 rounded-xl overflow-x-auto bg-card shadow-2xs max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                            <th className="px-3 py-2 border-r border-border/60">Ligne</th>
                            <th className="px-3 py-2 border-r border-border/60">Client</th>
                            <th className="px-3 py-2 border-r border-border/60">Téléphone</th>
                            <th className="px-3 py-2 border-r border-border/60">Wilaya DB</th>
                            <th className="px-3 py-2 border-r border-border/60">Statut</th>
                            <th className="px-3 py-2 border-r border-border/60">Action prévue</th>
                            <th className="px-3 py-2">Motif / Correspondance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-foreground">
                          {verificationData.sample_verifications.map((sample, idx) => {
                            const isNew = sample.status === 'new';
                            const isExisting = sample.status === 'existing';
                            const isInvalid = sample.status === 'invalid';

                            return (
                              <tr key={idx} className="hover:bg-muted/20">
                                <td className="px-3 py-1.5 text-muted-foreground font-mono text-[11px] bg-muted/20 border-r border-border/60">
                                  #{sample.line}
                                </td>
                                <td className="px-3 py-1.5 font-medium whitespace-nowrap max-w-[170px] truncate border-r border-border/60">
                                  <div>{sample.name}</div>
                                  {sample.rc_number && (
                                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <FileText className="h-2.5 w-2.5 text-indigo-500" />
                                      <span>RC: {sample.rc_number}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap border-r border-border/60">
                                  <div>{sample.phone}</div>
                                  {sample.storm_phone && sample.storm_phone !== '—' && (
                                    <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                                      <Zap className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                                      <span>STORM: {sample.storm_phone}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap border-r border-border/60 font-medium text-foreground">
                                  {sample.wilaya}
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap border-r border-border/60">
                                  {isNew && (
                                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                      Nouveau
                                    </Badge>
                                  )}
                                  {isExisting && (
                                    <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                                      Existant
                                    </Badge>
                                  )}
                                  {isInvalid && (
                                    <Badge variant="destructive" className="text-[10px] font-semibold">
                                      Invalide
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 whitespace-nowrap border-r border-border/60">
                                  {sample.action === 'create' && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                      + Créer
                                    </span>
                                  )}
                                  {sample.action === 'update' && (
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                                      ✎ Mettre à jour
                                    </span>
                                  )}
                                  {sample.action === 'skip' && (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                      ∅ Ignorer
                                    </span>
                                  )}
                                  {sample.action === 'error' && (
                                    <span className="text-destructive font-semibold text-[11px]">
                                      ⚠ Non importé
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-1.5 text-muted-foreground text-[11px] max-w-[200px] truncate">
                                  {sample.match_reason}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: RESULT */}
            {step === 'result' && result && (
              <div className="space-y-6 py-2">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Importation terminée avec succès !
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Le fichier a été traité avec réconciliation des wilayas et application de votre stratégie de doublons.
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
                  disabled={extractingWilayas || extractingRegions || verifying}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Changer de fichier</span>
                </Button>

                <div className="flex items-center gap-2">
                  {!canProceedFromMapping() && (
                    <span className="text-[11px] text-destructive font-medium hidden sm:inline-block">
                      * Nom et Téléphone obligatoires
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!canProceedFromMapping() || extractingWilayas || extractingRegions || verifying}
                    onClick={handleProceedFromMapping}
                    className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  >
                    {extractingWilayas || extractingRegions ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{extractingWilayas ? 'Extraction des Wilayas...' : 'Extraction des Régions...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{mapping.wilaya ? 'Étape suivante : Wilayas' : (mapping.region ? 'Étape suivante : Régions' : 'Étape suivante : Vérification')}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'wilayas' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('mapping')}
                  disabled={verifying || extractingRegions}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Modifier le mappage</span>
                </Button>

                <Button
                  size="sm"
                  disabled={verifying || extractingRegions}
                  onClick={handleProceedFromWilayas}
                  className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                >
                  {verifying || extractingRegions ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{extractingRegions ? 'Extraction des Régions...' : 'Audit et vérification...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mapping.region ? 'Valider les Wilayas & Configurer les Régions' : 'Valider les Wilayas & Vérifier les doublons'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === 'regions' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(mapping.wilaya ? 'wilayas' : 'mapping')}
                  disabled={verifying}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{mapping.wilaya ? 'Modifier les Wilayas' : 'Modifier le mappage'}</span>
                </Button>

                <Button
                  size="sm"
                  disabled={verifying}
                  onClick={() => handleProceedToVerification(wilayaMapping, regionMapping)}
                  className="gap-2 rounded-lg h-9 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Audit et vérification...</span>
                    </>
                  ) : (
                    <>
                      <span>Valider les Régions & Vérifier les doublons</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(mapping.region ? 'regions' : (mapping.wilaya ? 'wilayas' : 'mapping'))}
                  disabled={executing}
                  className="gap-2 rounded-lg h-9 px-4 text-xs font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{mapping.region ? 'Modifier les Régions' : (mapping.wilaya ? 'Modifier les Wilayas' : 'Modifier le mappage')}</span>
                </Button>

                <Button
                  size="sm"
                  disabled={executing}
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
                      <span>Confirmer et lancer l&apos;importation</span>
                      <Check className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
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
