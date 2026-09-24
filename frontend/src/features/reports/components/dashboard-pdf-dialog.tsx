'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  MapPin,
  TrendingUp,
  Check,
  Info,
  Printer,
  Loader2,
  AlertCircle,
  Coins,
  BarChart3,
} from 'lucide-react';

export interface DashboardPdfFilters {
  reportType: 'clients_by_region' | 'dashboard_summary';
  region?: string;
  debt_only?: boolean;
  min_solde?: number;
  include_charts?: boolean;
}

interface DashboardPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (filters: DashboardPdfFilters) => void;
  loading?: boolean;
}

const REGION_OPTIONS = [
  { value: 'Toutes les régions', label: 'Toutes les régions (1 région par page)' },
  { value: 'Centre Est', label: 'Centre Est' },
  { value: 'Centre Ouest', label: 'Centre Ouest' },
  { value: 'Est Star', label: 'Est Star' },
  { value: 'Est Sti', label: 'Est Sti' },
  { value: 'Ouest', label: 'Ouest' },
  { value: 'Sud', label: 'Sud' },
];

export function DashboardPdfDialog({
  open,
  onOpenChange,
  onGenerate,
  loading = false,
}: DashboardPdfDialogProps) {
  const [selectedType, setSelectedType] = useState<'clients_by_region' | 'dashboard_summary'>(
    'clients_by_region'
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('Toutes les régions');
  const [debtOnly, setDebtOnly] = useState<boolean>(false);
  const [minSolde, setMinSolde] = useState<string>('0');
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);

  const handleConfirm = () => {
    const parsedMin = debtOnly && minSolde !== '' && Number(minSolde) >= 0 ? Number(minSolde) : undefined;
    onGenerate({
      reportType: selectedType,
      region:
        selectedRegion === 'Toutes les régions' || selectedRegion === 'all'
          ? undefined
          : selectedRegion,
      debt_only: debtOnly,
      min_solde: parsedMin,
      include_charts: includeCharts,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[28px] p-0 overflow-hidden border-border/70 shadow-2xl bg-card max-h-[92vh] flex flex-col">
        {/* Header Banner matching Diffuser une Notification Push */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-6 py-5 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card"></span>
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Génération de Rapport PDF
                  <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-primary/10 text-primary border-primary/20 rounded-full">
                    Multi-pages
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Sélectionnez le format et les paramètres du document à exporter ou imprimer.
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Moteur PDF Actif</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target / Report Type Cards matching Notification Push audience cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Type de rapport</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'clients_by_region',
                  label: 'Clients & Encaissements par Région',
                  desc: 'Chaque région sur une page séparée avec wilaya, dernier encaissement et solde actuel à jour.',
                  icon: MapPin,
                  badge: 'Recommandé',
                },
                {
                  id: 'dashboard_summary',
                  label: 'Synthèse Globale du Tableau de Bord',
                  desc: 'Rapport consolidé des indicateurs clés, graphiques d’activité et performances globales.',
                  icon: TrendingUp,
                },
              ].map((item) => {
                const isSelected = selectedType === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold py-0 px-1.5 bg-primary/10 text-primary border-primary/20 rounded-full"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {isSelected && <Check className="h-4 w-4 text-primary font-bold" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region selector matching the Region selector in Notification Push */}
          {selectedType === 'clients_by_region' && (
            <div className="space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/60 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Sélectionner la Région *
                  </label>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {REGION_OPTIONS.length} options disponibles
                  </span>
                </div>
                <Select value={selectedRegion} onValueChange={(val) => setSelectedRegion(val || 'Toutes les régions')} required>
                  <SelectTrigger className="w-full text-xs sm:text-sm rounded-xl h-11 bg-card border-border/80 px-3.5 flex items-center justify-between">
                    {(() => {
                      const selectedOpt = REGION_OPTIONS.find((r) => r.value === selectedRegion);
                      if (selectedOpt) {
                        return (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                              {selectedOpt.label}
                            </span>
                          </div>
                        );
                      }
                      return <SelectValue placeholder="Choisir une région commerciale..." />;
                    })()}
                  </SelectTrigger>
                  <SelectContent className="w-[calc(100vw-3rem)] sm:w-[580px] max-w-full max-h-[300px]">
                    {REGION_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="py-2.5 px-3 text-xs sm:text-sm cursor-pointer w-full">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{r.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Debt Filter Checkbox & Minimal Solde Container */}
              <div className="space-y-3.5 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <label htmlFor="debt-only" className="text-xs font-bold text-foreground cursor-pointer select-none">
                        Uniquement les clients débiteurs
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        {debtOnly && Number(minSolde) > 0
                          ? `Filtrer les clients ayant un solde actuel ≥ ${Number(minSolde).toLocaleString('fr-DZ')} DA`
                          : 'Filtrer les clients ayant un solde actuel supérieur à 0 DA'}
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    id="debt-only"
                    checked={debtOnly}
                    onCheckedChange={(checked) => setDebtOnly(Boolean(checked))}
                    className="h-5 w-5 rounded-md border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>

                {/* Defined Minimal Solde Input */}
                {debtOnly && (
                  <div className="pt-3 border-t border-border/40 animate-in fade-in-50 duration-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="min-solde" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        Définir le solde minimal requis :
                      </label>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Valeur actuelle : {Number(minSolde || 0).toLocaleString('fr-DZ')} DZD
                      </span>
                    </div>

                    <div className="relative">
                      <Input
                        id="min-solde"
                        type="number"
                        min="0"
                        step="1000"
                        value={minSolde}
                        onChange={(e) => setMinSolde(e.target.value)}
                        placeholder="Ex: 10000, 50000, 100000..."
                        className="text-xs rounded-xl h-10 pr-14 font-mono font-bold bg-card border-border/80 focus-visible:ring-primary/30"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        DZD
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-muted-foreground font-medium mr-1">Raccourcis :</span>
                      {[0, 10000, 50000, 100000, 500000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMinSolde(String(preset))}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-all ${
                            Number(minSolde) === preset
                              ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                              : 'bg-card text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {preset === 0 ? '> 0 DA' : `≥ ${preset.toLocaleString('fr-DZ')} DA`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Include Charts & Analytical Insights Option */}
          {selectedType === 'clients_by_region' && (
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between transition-all hover:bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <label htmlFor="include-charts" className="text-xs font-bold text-foreground cursor-pointer select-none flex items-center gap-1.5">
                    <span>Inclure les Graphiques Visuels & Synthèse Analytique</span>
                    <Badge variant="outline" className="text-[9px] font-bold py-0 px-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
                      Recommandé
                    </Badge>
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Génère les graphiques par wilaya, ratios d'encaissement, Focus Top débiteurs et diagnostics textuels rédigés.
                  </p>
                </div>
              </div>
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
                className="h-5 w-5 rounded-md border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          )}

          {/* Estimate / Output Format Pill matching reach estimate pill */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0" />
              <span>
                Format de sortie :{' '}
                <strong className="text-foreground font-bold">
                  {selectedType === 'clients_by_region'
                    ? `A4 Paysage • ${
                        selectedRegion === 'Toutes les régions' || selectedRegion === 'all'
                          ? 'Toutes les régions (1 région par page)'
                          : `Région ${selectedRegion}`
                      }${
                        debtOnly
                          ? Number(minSolde) > 0
                            ? ` • Solde ≥ ${Number(minSolde).toLocaleString('fr-DZ')} DA`
                            : ' • Solde > 0 DA'
                          : ''
                      }${includeCharts ? ' • Avec Graphiques & Synthèse' : ''}`
                    : 'Synthèse Exécutive Globale'}
                </strong>
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            >
              Page-Break Actif
            </Badge>
          </div>
        </div>

        {/* Footer Bar matching Notification Push footer */}
        <div className="p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <Printer className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Export haute résolution compatible impression navigateur</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl h-9 px-4 font-semibold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="text-xs rounded-xl h-9 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  <span>Générer et prévisualiser</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
