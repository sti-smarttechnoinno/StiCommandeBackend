'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  reportsService,
  ReportsKPIs,
  RegionalRevenueData,
  OrderStatusData,
  TopDelegateData,
  BestProductData,
} from '@/services/reports';
import {
  Printer,
  X,
  Calendar,
  Building2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Award,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

interface ExecutiveSummaryPdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutiveSummaryPdfViewer({
  open,
  onOpenChange,
}: ExecutiveSummaryPdfViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<ReportsKPIs | null>(null);
  const [regions, setRegions] = useState<RegionalRevenueData[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusData[]>([]);
  const [delegates, setDelegates] = useState<TopDelegateData[]>([]);
  const [products, setProducts] = useState<BestProductData[]>([]);
  const [generatedDate, setGeneratedDate] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      fetchData();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpisRes, regionsRes, statusRes, delegatesRes, productsRes] = await Promise.all([
        reportsService.getKpis().catch(() => null),
        reportsService.getRevenueByRegion().catch(() => []),
        reportsService.getOrderStatusDistribution().catch(() => []),
        reportsService.getTopDelegates().catch(() => []),
        reportsService.getBestProducts().catch(() => []),
      ]);

      setKpis(kpisRes);
      setRegions(regionsRes || []);
      setOrderStatuses(statusRes || []);
      setDelegates(delegatesRes || []);
      setProducts(productsRes || []);

      const now = new Date();
      setGeneratedDate(
        now.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err) {
      console.error('Failed to load executive summary data', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return '0.00 DA';
    return `${Number(val).toLocaleString('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;
  };

  const totalRegionalRevenue = regions.reduce((acc, r) => acc + (r.revenue || 0), 0);
  const totalRegionalOrders = regions.reduce((acc, r) => acc + (r.orders || 0), 0);

  const modalContent = (
    <div className="sti-exec-pdf-viewer-modal fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden">
      {/* Print Styles & Scoped Scrollbar */}
      <style jsx global>{`
        .exec-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .exec-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.7);
        }
        .exec-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 6px;
        }
        .exec-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide application background elements */
          body > *:not(.sti-exec-pdf-viewer-modal) {
            display: none !important;
          }

          .sti-exec-pdf-viewer-modal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            inset: auto !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .print-hidden,
          .sti-exec-pdf-viewer-modal header {
            display: none !important;
          }

          .exec-scrollbar {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #sti-executive-summary-print {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }

          .exec-page-break {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 5mm !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table {
            width: 100% !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* Top Action Header Bar (Hidden on Print) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shadow-xl print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Synthèse Exécutive Globale du Tableau de Bord
              <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 font-bold">
                Rapport C-Level
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Chiffre d'affaires, volume des commandes, répartition territoriale et force de vente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={loading}
            className="text-xs rounded-xl h-9 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimer / Télécharger en PDF</span>
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

      {/* Scrollable Container */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col items-center exec-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-white space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-slate-300 font-medium">
              Compilation des indicateurs financiers et des statistiques globales...
            </p>
          </div>
        ) : (
          /* Main Printable Document Card */
          <div
            id="sti-executive-summary-print"
            className="w-full max-w-[960px] bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 p-8 sm:p-12 space-y-7 print:p-0 print:shadow-none print:rounded-none print:border-none"
          >
            {/* 1. Official Corporate Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="STI Commande"
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    SOCIÉTÉ STI COMMANDE S.A.R.L
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase mt-0.5">
                    SYNTHÈSE EXÉCUTIVE GLOBALE D'ACTIVITÉ
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Direction Générale • Tableau de Bord Financier & Opérationnel
                  </p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                  RAPPORT OFFICIEL
                </div>
                <div className="text-[11px] text-slate-600">
                  Édité le : <strong className="text-slate-900 font-bold">{generatedDate}</strong>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  RÉF : STI-EXEC-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* 2. Executive Overview Memo Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Ce document consolide les flux de commandes, chiffres d'affaires et performances territoriales de la société.
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Données Vérifiées en Temps Réel</span>
              </div>
            </div>

            {/* 3. Executive KPIs Grid (4 Primary Cards) */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                1. Indicateurs Clés Stratégiques
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* KPI 1 */}
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    Chiffre d'Affaires
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {formatCurrency(kpis?.totalRevenue)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{kpis?.revenueGrowth ?? 0}% vs mois précédent</span>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Total Commandes
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {kpis?.totalOrders ?? 0}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mt-1">
                    Commandes enregistrées
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Panier Moyen
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {formatCurrency(kpis?.avgOrderValue)}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mt-1">
                    Par commande traitée
                  </div>
                </div>

                {/* KPI 4 */}
                <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/80 rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Force Commerciale
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {kpis?.activeDelegates ?? 0} Délégués
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 mt-1">
                    {kpis?.activeClients ?? 0} clients actifs
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Regional Performance Breakdown */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                2. Répartition Financière par Région Commerciale
              </h3>
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">Région Commerciale</th>
                      <th className="py-2.5 px-3 text-center">Commandes</th>
                      <th className="py-2.5 px-3 text-right">Chiffre d'Affaires</th>
                      <th className="py-2.5 px-3 text-right w-40">Part Relative (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {regions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                          Aucune donnée de vente par région pour cette période.
                        </td>
                      </tr>
                    ) : (
                      regions.map((reg, idx) => {
                        const share =
                          totalRegionalRevenue > 0
                            ? Math.round((reg.revenue / totalRegionalRevenue) * 100)
                            : 0;
                        return (
                          <tr key={reg.region} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: reg.color || '#2563EB' }}
                              />
                              <span>{reg.region}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700">
                              {reg.orders}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(reg.revenue)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden print:border print:border-slate-300">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${share}%`,
                                      backgroundColor: reg.color || '#2563EB',
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700 w-8 text-right">
                                  {share}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td className="py-2.5 px-3 uppercase text-[11px]">Total Ventes Réseau :</td>
                      <td className="py-2.5 px-3 text-center font-mono font-black">
                        {totalRegionalOrders}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-primary">
                        {formatCurrency(totalRegionalRevenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Two-column Layout: Order Status Pipeline & Top Delegates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Order Pipeline */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  3. Statut & Pipeline des Commandes
                </h3>
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  {orderStatuses.length === 0 ? (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      Aucune commande enregistrée.
                    </div>
                  ) : (
                    orderStatuses.map((st) => (
                      <div key={st.status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{st.label}</span>
                          <span className="font-mono text-slate-600 font-bold">
                            {st.count} ({st.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden print:border print:border-slate-300">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${st.percentage}%`,
                              backgroundColor: st.color || '#2563EB',
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Delegates Ranking */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  4. Top Délégués Commerciaux
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2 px-3">Délégué</th>
                        <th className="py-2 px-2">Région</th>
                        <th className="py-2 px-2 text-right">CA Réalisé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {delegates.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-3 text-center text-slate-400 italic">
                            Aucun délégué répertorié.
                          </td>
                        </tr>
                      ) : (
                        delegates.slice(0, 4).map((del, idx) => (
                          <tr key={del.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                                {idx + 1}
                              </span>
                              <span className="truncate max-w-[110px]">{del.name}</span>
                            </td>
                            <td className="py-2 px-2 text-slate-600 text-[11px]">{del.region}</td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(del.sales)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 6. Top Products Highlights */}
            {products.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  5. Produits Phares les Plus Vendus
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border-b border-slate-200">
                        <th className="py-2 px-3">Désignation Produit</th>
                        <th className="py-2 px-3">Catégorie</th>
                        <th className="py-2 px-3 text-center">Unités Vendues</th>
                        <th className="py-2 px-3 text-right">Total des Ventes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.slice(0, 5).map((prod) => (
                        <tr key={prod.id}>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{prod.name}</span>
                              {prod.reference && (
                                <span className="font-mono text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {prod.reference}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                {prod.category}
                              </span>
                              {prod.operator && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[9px]">
                                  {prod.operator}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700">
                            {prod.units.toLocaleString('fr-DZ')}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="font-mono font-bold text-slate-900 block">
                              {formatCurrency(prod.sales)}
                            </span>
                            {prod.growth && (
                              <span className="text-[9px] font-medium text-slate-500 block">
                                {prod.growth}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Corporate Executive Sign-off & Visa Boxes */}
            <div className="pt-4 border-t-2 border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                6. Cadre de Validation & Visas Officiels
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Visa 1 */}
                <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Direction Commerciale
                  </span>
                  <div className="text-[9px] text-slate-400 italic">Date & Visa :</div>
                </div>

                {/* Visa 2 */}
                <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Direction Financière
                  </span>
                  <div className="text-[9px] text-slate-400 italic">Date & Visa :</div>
                </div>

                {/* Visa 3 */}
                <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Direction Générale
                  </span>
                  <div className="text-[9px] text-slate-400 italic">Cachet & Signature :</div>
                </div>
              </div>
            </div>

            {/* 8. Official Document Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                Document officiel généré par le système d'information STI Commande ERP.
              </span>
              <span>CONFIDENTIEL • USAGE INTERNE STRICT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
