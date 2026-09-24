'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClientsByRegionReportResponse,
  ClientReportItem,
  RegionReportGroup,
} from '@/services/reports';
import {
  Printer,
  X,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck2,
  Loader2,
  Layers,
  BarChart3,
  TrendingUp,
  Coins,
  Building2,
  Phone,
  FileSignature,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ClientsByRegionPdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ClientsByRegionReportResponse | null;
  loading: boolean;
  includeCharts?: boolean;
}

export function ClientsByRegionPdfViewer({
  open,
  onOpenChange,
  data,
  loading,
  includeCharts = true,
}: ClientsByRegionPdfViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [activeRegionNav, setActiveRegionNav] = useState<string>('all');
  const [printingSingleRegion, setPrintingSingleRegion] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent background scrolling on body when viewer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setPrintingSingleRegion(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const handlePrintAll = () => {
    setPrintingSingleRegion(null);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handlePrintSingleRegion = (regionName: string) => {
    setPrintingSingleRegion(regionName);
    setTimeout(() => {
      window.print();
      // Auto-reset single region printing after print dialog closes
      setTimeout(() => {
        setPrintingSingleRegion(null);
      }, 1000);
    }, 50);
  };

  const scrollToRegion = (regionName: string) => {
    setActiveRegionNav(regionName);
    if (regionName === 'all') {
      const topElement = document.getElementById('report-top-anchor');
      topElement?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const element = document.getElementById(`region-sheet-${encodeURIComponent(regionName)}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return '0.00 DA';
    return `${Number(val).toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;
  };

  const modalContent = (
    <div className="sti-pdf-viewer-modal fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden">
      {/* Dynamic Scoped Print & Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Webkit custom scrollbar for screen view */
        .report-viewer-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .report-viewer-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.7);
        }
        .report-viewer-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
        }
        .report-viewer-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm 8mm 8mm 8mm;
          }

          /* Reset root elements so pagination is fully unlocked */
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all application chrome and background elements */
          body > *:not(.sti-pdf-viewer-modal) {
            display: none !important;
          }

          /* Unclamp the viewer modal so it flows naturally through all print pages */
          .sti-pdf-viewer-modal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            inset: auto !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          /* Hide headers, controls, and nav bars */
          .print-hidden,
          .sti-pdf-viewer-modal header,
          .sti-pdf-viewer-modal .report-nav-bar,
          .single-region-print-btn {
            display: none !important;
          }

          /* Single Region isolation during print */
          ${printingSingleRegion ? `
            .region-page-break:not(#region-sheet-${encodeURIComponent(printingSingleRegion)}) {
              display: none !important;
            }
            #national-summary-sheet {
              display: none !important;
            }
          ` : ''}

          /* Allow scroll container to expand across all pages */
          .sti-pdf-viewer-modal .report-viewer-scrollbar {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Printable document wrapper */
          #sti-clients-region-report-print {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          /* Each region sheet starts on a new page */
          .region-page-break {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            margin: 0 0 10mm 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }

          .region-page-break:first-of-type {
            page-break-before: avoid !important;
            break-before: avoid !important;
            margin-top: 0 !important;
          }

          /* Never cut chart and signoff cards in half */
          .chart-container-print,
          .signoff-box-print {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Table wrapper must be overflow visible to paginate rows */
          .table-responsive-wrapper {
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Table pagination rules */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          td, th {
            padding: 3px 5px !important;
            font-size: 8.5pt !important;
          }
        }
      `}</style>

      {/* Action Header Bar (Hidden on Print) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shadow-xl print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              État des Clients & Solde par Région (1 Région par Page)
              <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                Aperçu Multi-pages
              </Badge>
              {includeCharts && (
                <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                  <BarChart3 className="h-2.5 w-2.5" />
                  Graphiques & Diagnostic Actifs
                </Badge>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {data ? (
                <>
                  {data.meta.total_regions} région(s) • {data.meta.total_clients} clients • Solde total dû :{' '}
                  <span className="font-semibold text-amber-400">
                    {formatCurrency(data.meta.total_solde)}
                  </span>
                  {data.meta.filter_min_solde && data.meta.filter_min_solde > 0 && (
                    <span className="text-amber-400 font-semibold">
                      {' '}• Solde min : ≥ {Number(data.meta.filter_min_solde).toLocaleString('fr-DZ')} DA
                    </span>
                  )}
                </>
              ) : (
                'Chargement des données en cours...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {printingSingleRegion && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPrintingSingleRegion(null)}
              className="text-xs rounded-xl h-9 px-3 text-amber-400 border-amber-400/40 bg-amber-950/40 hover:bg-amber-900/50 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rétablir Toutes les Régions</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handlePrintAll}
            disabled={loading || !data}
            className="text-xs rounded-xl h-9 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimer Tout le Dossier PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl h-9 px-3.5 font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700"
          >
            <X className="h-4 w-4" />
            <span className="ml-1">Fermer</span>
          </Button>
        </div>
      </header>

      {/* Quick Region Navigation Bar (Screen only) */}
      {data && data.regions.length > 1 && (
        <div className="report-nav-bar sticky top-[61px] z-20 px-6 py-2 bg-slate-900/95 backdrop-blur border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto print:hidden shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Aller à la région :
          </span>
          <button
            type="button"
            onClick={() => scrollToRegion('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeRegionNav === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Vue d'ensemble ({data.meta.total_clients} clients)
          </button>
          {data.regions.map((reg) => (
            <button
              key={reg.region}
              type="button"
              onClick={() => scrollToRegion(reg.region)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeRegionNav === reg.region
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{reg.region}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
                {reg.clients_count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Document Viewer Container - Scrollable with min-h-0 */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col items-center report-viewer-scrollbar">
        <div id="report-top-anchor" className="h-0 w-0" />

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-white space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
            <p className="text-sm text-slate-300 font-medium">
              Génération de l'état par région et calcul des graphiques analytiques...
            </p>
          </div>
        ) : !data || data.regions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card p-8 rounded-2xl max-w-md text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
            <h3 className="text-base font-bold text-foreground">Aucun client trouvé</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Aucune donnée ne correspond aux filtres de région ou de solde débiteur sélectionnés.
            </p>
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        ) : (
          /* Printable Document Wrapper containing individual sheets */
          <div id="sti-clients-region-report-print" className="w-full max-w-[1240px] space-y-8 print:space-y-0">
            {/* 1. NATIONAL SUMMARY COVER SHEET (When multiple regions exist and charts enabled) */}
            {includeCharts && data.regions.length > 1 && !printingSingleRegion && (
              <NationalSummaryCoverSheet data={data} formatCurrency={formatCurrency} />
            )}

            {/* 2. REGIONAL SHEETS (1 Region per Page) */}
            {data.regions.map((regionGroup, regionIndex) => (
              <RegionalSheet
                key={regionGroup.region}
                regionGroup={regionGroup}
                regionIndex={regionIndex}
                totalRegions={data.regions.length}
                meta={data.meta}
                includeCharts={includeCharts}
                formatCurrency={formatCurrency}
                onPrintThisRegion={() => handlePrintSingleRegion(regionGroup.region)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// -------------------------------------------------------------------------
// COMPONENT 1 : NATIONAL SUMMARY COVER SHEET (Page de Couverture & Synthèse)
// -------------------------------------------------------------------------
interface NationalSummaryCoverSheetProps {
  data: ClientsByRegionReportResponse;
  formatCurrency: (val?: number | null) => string;
}

function NationalSummaryCoverSheet({ data, formatCurrency }: NationalSummaryCoverSheetProps) {
  const sortedRegionsBySolde = useMemo(() => {
    return [...data.regions].sort((a, b) => b.total_solde - a.total_solde);
  }, [data.regions]);

  const maxSolde = useMemo(() => {
    return Math.max(...data.regions.map((r) => r.total_solde), 1);
  }, [data.regions]);

  const nationalDebtorsRate = useMemo(() => {
    return data.meta.total_clients > 0
      ? Math.round((data.meta.total_debtors / data.meta.total_clients) * 100)
      : 0;
  }, [data.meta]);

  const topDebtorRegion = sortedRegionsBySolde[0];
  const topRegionShare = data.meta.total_solde > 0
    ? Math.round((topDebtorRegion.total_solde / data.meta.total_solde) * 100)
    : 0;

  return (
    <div
      id="national-summary-sheet"
      className="region-page-break w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-10 mb-8 print:mb-0 print:p-0 print:shadow-none print:rounded-none print:border-none"
    >
      {/* Header Banner */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="STI Commande"
            className="h-14 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              SOCIÉTÉ STI COMMANDE
            </h1>
            <p className="text-[11px] text-slate-500 font-bold tracking-wider uppercase">
              SYNTHÈSE ANALYTIQUE NATIONALE • CRÉANCES & RECOUVREMENT
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                Document édité le : <strong>{data.meta.generated_at}</strong>
              </span>
              {data.meta.last_import_at && (
                <span className="flex items-center gap-1">
                  <FileCheck2 className="h-3 w-3 text-emerald-600" />
                  Dernier relevé d'encaissements : <strong>{data.meta.last_import_at}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <Badge className="bg-slate-900 text-white font-mono text-xs px-3 py-1">
            DOCUMENT STRATÉGIQUE
          </Badge>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">
            Rapport consolidé sur {data.meta.total_regions} régions
          </p>
        </div>
      </div>

      {/* National KPI Grid */}
      <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5">
        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            Portefeuille Clients Total
          </span>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {data.meta.total_clients.toLocaleString('fr-DZ')} clients
          </div>
          <span className="text-[10px] text-slate-500">
            dont <strong className="text-amber-700">{data.meta.total_debtors} débiteurs ({nationalDebtorsRate}%)</strong>
          </span>
        </div>

        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            Solde National Total Dû
          </span>
          <div className="text-base font-black text-rose-700 mt-0.5">
            {formatCurrency(data.meta.total_solde)}
          </div>
          <span className="text-[10px] text-slate-500">
            Créances actives cumulées
          </span>
        </div>

        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            Derniers Encaissements Perçus
          </span>
          <div className="text-base font-black text-emerald-700 mt-0.5">
            {formatCurrency(data.meta.total_last_payments)}
          </div>
          <span className="text-[10px] text-slate-500">
            Total des derniers versements
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            Exposition Moyenne / Débiteur
          </span>
          <div className="text-base font-black text-indigo-700 mt-0.5">
            {data.meta.total_debtors > 0
              ? formatCurrency(data.meta.total_solde / data.meta.total_debtors)
              : '0.00 DA'}
          </div>
          <span className="text-[10px] text-slate-500">
            Créance moyenne par compte
          </span>
        </div>
      </div>

      {/* Main Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 chart-container-print">
        {/* Chart 1: Barres Comparatives Régionales */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              1. Répartition du Solde Dû par Région
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Part relative en %</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {sortedRegionsBySolde.map((r) => {
              const share = data.meta.total_solde > 0
                ? Math.round((r.total_solde / data.meta.total_solde) * 100)
                : 0;
              const barWidth = maxSolde > 0 ? Math.max(3, (r.total_solde / maxSolde) * 100) : 0;

              return (
                <div key={r.region} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{r.region}</span>
                      <span className="text-[10px] text-slate-500">({r.delegate_name})</span>
                    </div>
                    <div className="font-mono text-[11px] font-bold text-rose-700">
                      {formatCurrency(r.total_solde)} <span className="text-slate-500 font-normal">({share}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden print:border print:border-slate-300">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Comparatif Solde Dû vs Derniers Encaissements */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              2. Rapprochement Créance vs Encaissements
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Encaissements
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Solde Dû
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {sortedRegionsBySolde.map((r) => {
              const maxVal = Math.max(r.total_solde, r.total_last_payments, 1);
              const paymentsPct = (r.total_last_payments / maxVal) * 100;
              const soldePct = (r.total_solde / maxVal) * 100;

              return (
                <div key={r.region} className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>{r.region}</span>
                    <span className="text-[10px] text-slate-600">
                      Recouvré : <strong className="text-emerald-700">{formatCurrency(r.total_last_payments)}</strong>
                    </span>
                  </div>
                  {/* Two comparative progress lines */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold w-12 text-emerald-700">Reçu</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paymentsPct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold w-12 text-rose-700">Dû</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${soldePct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparative National Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold text-[10.5px] uppercase tracking-wider border-b border-slate-200">
              <th className="py-2 px-3">Région Commerciale</th>
              <th className="py-2 px-3">Délégué Assigné</th>
              <th className="py-2 px-3 text-center">Total Clients</th>
              <th className="py-2 px-3 text-center">Débiteurs (%)</th>
              <th className="py-2 px-3 text-right">Derniers Encaissements</th>
              <th className="py-2 px-3 text-right">Solde Total Dû</th>
              <th className="py-2 px-3 text-right">Part du Risque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRegionsBySolde.map((r, idx) => {
              const debtorsPct = r.clients_count > 0 ? Math.round((r.debtors_count / r.clients_count) * 100) : 0;
              const riskShare = data.meta.total_solde > 0 ? Math.round((r.total_solde / data.meta.total_solde) * 100) : 0;

              return (
                <tr key={r.region} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                      {idx + 1}
                    </span>
                    <span>{r.region}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-700 font-medium">{r.delegate_name}</td>
                  <td className="py-2 px-3 text-center font-mono font-semibold">{r.clients_count}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-amber-700">
                    {r.debtors_count} ({debtorsPct}%)
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(r.total_last_payments)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                    {formatCurrency(r.total_solde)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {riskShare}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Executive Strategic Diagnostic & Written Explanation */}
      <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white border border-indigo-200/80 rounded-xl p-4 mb-5 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Diagnostic Exécutif Stratégique & Recommandations de Direction
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Le portefeuille national présente un encours global de <strong>{formatCurrency(data.meta.total_solde)}</strong> réparti sur <strong>{data.meta.total_regions} régions</strong>. 
          À l'échelle nationale, <strong>{nationalDebtorsRate}% des clients ({data.meta.total_debtors} comptes)</strong> présentent actuellement un solde débiteur.
        </p>
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong>Concentration principale :</strong> La région <strong>{topDebtorRegion.region}</strong> (Délégué : <em>{topDebtorRegion.delegate_name}</em>) concentre à elle seule <strong>{topRegionShare}%</strong> de la créance globale avec un solde cumulé de <strong>{formatCurrency(topDebtorRegion.total_solde)}</strong>. 
          Une attention prioritaire de recouvrement doit y être déployée lors des tournées commerciales de cette période.
        </p>
      </div>

      {/* Corporate Direction Sign-off & Visas */}
      <div className="pt-3 border-t-2 border-slate-200 signoff-box-print">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
          Cadre de Validation & Visas Officiels de Direction
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-slate-300 rounded-xl p-3 h-24 flex flex-col justify-between bg-slate-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Direction Générale (Validation Stratégique)
            </span>
            <div className="text-[9px] text-slate-400 italic">Date & Visa :</div>
          </div>
          <div className="border border-slate-300 rounded-xl p-3 h-24 flex flex-col justify-between bg-slate-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Direction Financière & Recouvrement
            </span>
            <div className="text-[9px] text-slate-400 italic">Date & Visa :</div>
          </div>
        </div>
      </div>

      {/* Sheet Page Footer */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
        <span>Document généré automatiquement par STI Commande</span>
        <span>Page de Synthèse Nationale — Multi-Régions</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// COMPONENT 2 : REGIONAL SHEET (1 Région par Page avec graphiques et diagnostics)
// -------------------------------------------------------------------------
interface RegionalSheetProps {
  regionGroup: RegionReportGroup;
  regionIndex: number;
  totalRegions: number;
  meta: ClientsByRegionReportResponse['meta'];
  includeCharts: boolean;
  formatCurrency: (val?: number | null) => string;
  onPrintThisRegion: () => void;
}

function RegionalSheet({
  regionGroup,
  regionIndex,
  totalRegions,
  meta,
  includeCharts,
  formatCurrency,
  onPrintThisRegion,
}: RegionalSheetProps) {
  // Compute Wilaya statistics for this region
  const wilayaStats = useMemo(() => {
    const map = new Map<string, { count: number; debtors: number; solde: number; payments: number }>();
    regionGroup.clients.forEach((c) => {
      const w = c.wilaya && c.wilaya.trim() ? c.wilaya.trim() : 'Autre';
      const curr = map.get(w) || { count: 0, debtors: 0, solde: 0, payments: 0 };
      curr.count += 1;
      if ((c.solde || 0) > 0) curr.debtors += 1;
      curr.solde += c.solde || 0;
      curr.payments += c.last_payment_amount || 0;
      map.set(w, curr);
    });
    return Array.from(map.entries())
      .map(([wilaya, stats]) => ({ wilaya, ...stats }))
      .sort((a, b) => b.solde - a.solde);
  }, [regionGroup.clients]);

  const maxWilayaSolde = useMemo(() => {
    return Math.max(...wilayaStats.map((w) => w.solde), 1);
  }, [wilayaStats]);

  // Compute Top Debtors in this region
  const topDebtors = useMemo(() => {
    return [...regionGroup.clients]
      .filter((c) => (c.solde || 0) > 0)
      .sort((a, b) => (b.solde || 0) - (a.solde || 0))
      .slice(0, 5);
  }, [regionGroup.clients]);

  const topDebtorsSum = useMemo(() => {
    return topDebtors.reduce((acc, c) => acc + (c.solde || 0), 0);
  }, [topDebtors]);

  const topDebtorsShare = regionGroup.total_solde > 0
    ? Math.round((topDebtorsSum / regionGroup.total_solde) * 100)
    : 0;

  const topWilaya = wilayaStats[0];
  const topWilayaShare = topWilaya && regionGroup.total_solde > 0
    ? Math.round((topWilaya.solde / regionGroup.total_solde) * 100)
    : 0;

  const regionalDebtorsRate = regionGroup.clients_count > 0
    ? Math.round((regionGroup.debtors_count / regionGroup.clients_count) * 100)
    : 0;

  return (
    <div
      id={`region-sheet-${encodeURIComponent(regionGroup.region)}`}
      className="region-page-break w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-10 mb-8 last:mb-0 print:mb-0 print:p-0 print:shadow-none print:rounded-none print:border-none"
    >
      {/* Region Header Section */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
        {/* Company Info & Logo */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="STI Commande"
            className="h-14 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              SOCIÉTÉ STI COMMANDE
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              ÉTAT DES CRÉANCES & ENCAISSEMENTS CLIENTS PAR RÉGION
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                Édité le : <strong>{meta.generated_at}</strong>
              </span>
              {meta.last_import_at && (
                <span className="flex items-center gap-1">
                  <FileCheck2 className="h-3 w-3 text-emerald-600" />
                  Dernier import : <strong>{meta.last_import_at}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Region Specific Banner & Print Single Button */}
        <div className="text-right flex flex-col items-end gap-1.5">
          <div className="inline-block bg-slate-900 text-white px-3.5 py-1.5 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 block">
              Région Commerciale
            </span>
            <span className="text-base font-black tracking-tight">
              {regionGroup.region}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            Délégué :{' '}
            <strong className="text-slate-900 font-bold">
              {regionGroup.delegate_name || 'Non affecté'}
            </strong>
          </div>

          {/* Quick Print Single Region (screen view only) */}
          <button
            type="button"
            onClick={onPrintThisRegion}
            className="single-region-print-btn print-hidden mt-1 text-[10px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-md border border-primary/20 flex items-center gap-1 transition-all"
            title="Imprimer uniquement la fiche de cette région"
          >
            <Printer className="h-3 w-3" />
            <span>Imprimer cette région uniquement</span>
          </button>
        </div>
      </div>

      {/* Region Quick Stats Ribbon */}
      <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-slate-800">
        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Total Clients
          </span>
          <span className="text-sm font-black text-slate-900">
            {regionGroup.clients_count}
          </span>
        </div>

        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            {meta.filter_min_solde && meta.filter_min_solde > 0
              ? `Clients Débiteurs (≥ ${Number(meta.filter_min_solde).toLocaleString('fr-DZ')} DA)`
              : 'Clients Débiteurs (Solde > 0)'}
          </span>
          <span className="text-sm font-black text-amber-700">
            {regionGroup.debtors_count} ({regionalDebtorsRate}%)
          </span>
        </div>

        <div className="border-r border-slate-200 pr-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Total Derniers Encaissements
          </span>
          <span className="text-sm font-black text-emerald-700">
            {formatCurrency(regionGroup.total_last_payments)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
            Solde Total Régional Dû
          </span>
          <span className="text-sm font-black text-rose-700">
            {formatCurrency(regionGroup.total_solde)}
          </span>
        </div>
      </div>

      {/* Visual Analytics & Explanations Block (Included if charts are active) */}
      {includeCharts && (
        <div className="mb-4 space-y-3 chart-container-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Chart: Wilaya Breakdown */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  Répartition du Solde par Wilaya ({wilayaStats.length} Wilayas)
                </span>
                <span className="text-[10px] text-slate-400">Montant dû</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                {wilayaStats.slice(0, 5).map((w) => {
                  const share = regionGroup.total_solde > 0 ? Math.round((w.solde / regionGroup.total_solde) * 100) : 0;
                  const barWidth = maxWilayaSolde > 0 ? Math.max(4, (w.solde / maxWilayaSolde) * 100) : 0;

                  return (
                    <div key={w.wilaya} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{w.wilaya}</span>
                          <span className="text-[9px] text-slate-500">({w.count} clients)</span>
                        </div>
                        <div className="font-mono text-[10px] font-bold text-rose-700">
                          {formatCurrency(w.solde)} <span className="text-slate-500 font-normal">({share}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden print:border print:border-slate-200">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Focus: Top 3/5 Debtors in Region */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  Focus Top Débiteurs Prioritaires ({topDebtors.length})
                </span>
                <span className="text-[10px] font-bold text-rose-700">
                  {topDebtorsShare}% de la dette régionale
                </span>
              </div>

              <div className="space-y-1 pt-0.5">
                {topDebtors.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic py-2">Aucun client débiteur dans cette région.</p>
                ) : (
                  topDebtors.map((td, idx) => (
                    <div key={td.id} className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50/40 border border-rose-100 text-[10.5px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[8px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 truncate block">{td.name}</span>
                          <span className="text-[9px] text-slate-500">{td.wilaya} • {td.phone || td.storm_phone || 'Sans tel'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-rose-700 shrink-0 ml-2">
                        {formatCurrency(td.solde)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Regional Written Diagnostic Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Diagnostic Commercial & Décisionnel :
            </span>
            <p className="text-[10.5px] leading-relaxed">
              La région <strong>{regionGroup.region}</strong> enregistre <strong>{regionGroup.debtors_count} clients débiteurs</strong> sur un effectif de <strong>{regionGroup.clients_count}</strong> ({regionalDebtorsRate}% d'exposition). 
              {topWilaya && (
                <>
                  {' '}La Wilaya de <strong>{topWilaya.wilaya}</strong> concentre la plus forte créance avec <strong>{formatCurrency(topWilaya.solde)}</strong> ({topWilayaShare}% du total régional).
                </>
              )}
              {topDebtors.length > 0 && (
                <>
                  {' '}Les <strong>{topDebtors.length} clients prioritaires</strong> identifiés ci-dessus représentent <strong>{topDebtorsShare}%</strong> de l'encours global. 
                  Une action de relance directe menée par le délégué <strong>{regionGroup.delegate_name}</strong> auprès de ces comptes permettra d'assainir la majorité de la créance.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Clients Table showing ALL clients of the region */}
      <div className="table-responsive-wrapper overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-200 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wider border-b border-slate-300">
              <th className="py-2 px-2.5 text-center w-10 border-r border-slate-200">#</th>
              <th className="py-2 px-2.5 w-24 border-r border-slate-200">Code</th>
              <th className="py-2 px-2.5 border-r border-slate-200">Client / Raison Sociale</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200">Wilaya</th>
              <th className="py-2 px-2.5 w-36 border-r border-slate-200">Téléphone(s)</th>
              <th className="py-2 px-2.5 w-52 border-r border-slate-200">Dernier Encaissement</th>
              <th className="py-2 px-2.5 text-right w-36">Solde Actuel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {regionGroup.clients.map((client, idx) => {
              const hasDebt = (client.solde || 0) > 0;
              return (
                <tr
                  key={client.id}
                  className={
                    idx % 2 === 0
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50/60 hover:bg-slate-100/50'
                  }
                >
                  <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2.5 font-mono font-semibold text-[11px] text-slate-700 border-r border-slate-200">
                    {client.client_code}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200">
                    <div className="font-bold text-slate-900 text-[11px]">
                      {client.name}
                    </div>
                    {client.rc_number && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        RC : {client.rc_number}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2.5 font-medium border-r border-slate-200">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold">
                      {client.wilaya}
                    </span>
                  </td>
                  <td className="py-1.5 px-2.5 text-[10px] border-r border-slate-200 space-y-0.5">
                    {client.phone && (
                      <div className="font-mono text-slate-700">
                        {client.phone}
                      </div>
                    )}
                    {client.storm_phone && (
                      <div className="font-mono text-blue-700 text-[9px]">
                        STORM: {client.storm_phone}
                      </div>
                    )}
                    {!client.phone && !client.storm_phone && (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200">
                    {client.last_payment_date ? (
                      <div>
                        <div className="font-bold text-emerald-700 text-[11px]">
                          {formatCurrency(client.last_payment_amount)}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>{client.last_payment_date}</span>
                          {client.last_payment_mode && (
                            <span className="font-medium text-slate-600">
                              • {client.last_payment_mode}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">
                        Aucun encaissement
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2.5 text-right font-mono text-[11px]">
                    <span
                      className={`font-black ${
                        hasDebt
                          ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(client.solde)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <td
                colSpan={5}
                className="py-2 px-3 text-right text-[11px] uppercase tracking-wider border-r border-slate-200"
              >
                Sous-Total Région ({regionGroup.region}) :
              </td>
              <td className="py-2 px-2.5 text-[11px] font-black text-emerald-800 border-r border-slate-200">
                {formatCurrency(regionGroup.total_last_payments)}
              </td>
              <td className="py-2 px-2.5 text-right text-[11px] font-black text-rose-800">
                {formatCurrency(regionGroup.total_solde)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Regional Sign-off & Visa Commitments Box */}
      {includeCharts && (
        <div className="mt-4 pt-3 border-t-2 border-slate-200 signoff-box-print">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-2">
            Visas Officiels & Engagements de Recouvrement
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-300 rounded-xl p-2.5 h-24 flex flex-col justify-between bg-slate-50/40">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700 block">
                Délégué : {regionGroup.delegate_name}
              </span>
              <div className="text-[8.5px] text-slate-400 italic">Date & Signature :</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-2.5 h-24 flex flex-col justify-between bg-slate-50/40">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700 block">
                Direction Financière
              </span>
              <div className="text-[8.5px] text-slate-400 italic">Date & Signature :</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-2.5 h-24 flex flex-col justify-between bg-slate-50/40">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700 block">
                Observations & Délais de Règlement
              </span>
              <div className="border-b border-dotted border-slate-300 h-3" />
              <div className="border-b border-dotted border-slate-300 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Sheet Page Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
        <span>
          Document généré automatiquement par la plateforme STI Commande
        </span>
        <span>
          Région {regionIndex + 1} / {totalRegions} — {regionGroup.region} ({regionGroup.clients_count} clients)
        </span>
      </div>
    </div>
  );
}
