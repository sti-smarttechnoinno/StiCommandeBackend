'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { delegatesService, type MonthlyObjectiveData, type DelegateObjectivesResponse } from '@/services/delegates';
import { formatCurrency, formatFullCurrency } from '../utils';
import {
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  Pencil,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  History,
  RotateCcw,
  Loader2,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

interface DelegateObjectivesCardProps {
  delegateId: string;
  delegateName: string;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function generateMonthYearOptions() {
  const options = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 - 12

  // 4 past months + current month + 12 upcoming months
  for (let offset = -4; offset <= 12; offset++) {
    const d = new Date(currentYear, currentMonth - 1 + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const isCurrent = y === currentYear && m === currentMonth;
    const isNext = (y === currentYear && m === currentMonth + 1) || (m === 1 && currentMonth === 12 && y === currentYear + 1);

    let tag = '';
    if (isCurrent) tag = ' (Mois en cours)';
    else if (isNext) tag = ' (Mois prochain)';

    options.push({
      key: `${y}-${String(m).padStart(2, '0')}`,
      year: y,
      month: m,
      label: `${MONTH_NAMES_FR[m - 1]} ${y}${tag}`,
      isCurrent,
      isNext,
    });
  }
  return options;
}

function generateQuickMonthShortcuts() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const shortcuts = [];
  
  // Current month
  shortcuts.push({
    key: 'current',
    year: currentYear,
    month: currentMonth,
    label: `Mois en cours (${MONTH_NAMES_FR[currentMonth - 1]})`,
  });

  // Next 2 months
  for (let i = 1; i <= 2; i++) {
    const d = new Date(currentYear, currentMonth - 1 + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    shortcuts.push({
      key: `next-${i}`,
      year: y,
      month: m,
      label: `${MONTH_NAMES_FR[m - 1]} ${y}`,
    });
  }

  return shortcuts;
}

export function DelegateObjectivesCard({ delegateId, delegateName }: DelegateObjectivesCardProps) {
  const [data, setData] = useState<DelegateObjectivesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [targetRevenue, setTargetRevenue] = useState<string>('');
  const [targetOrders, setTargetOrders] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const fetchObjectives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await delegatesService.getObjectives(delegateId);
      setData(res);
    } catch {
      toast.error('Erreur lors du chargement des objectifs');
    } finally {
      setLoading(false);
    }
  }, [delegateId]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const handleOpenSetObjective = (monthData?: MonthlyObjectiveData) => {
    const currentY = new Date().getFullYear();
    const currentM = new Date().getMonth() + 1;

    setSelectedYear(monthData?.year ?? currentY);
    setSelectedMonth(monthData?.month ?? currentM);
    setTargetRevenue(monthData?.isConfigured && monthData?.targetRevenue ? String(monthData.targetRevenue) : '');
    setTargetOrders(monthData?.isConfigured && monthData?.targetOrders ? String(monthData.targetOrders) : '');
    setNotes(monthData?.notes ?? '');
    setDialogOpen(true);
  };

  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    const rev = parseFloat(targetRevenue);
    if (isNaN(rev) || rev < 0) {
      toast.error('Veuillez entrer un montant d\'objectif valide.');
      return;
    }

    try {
      setSaving(true);
      await delegatesService.setObjective(delegateId, {
        year: selectedYear,
        month: selectedMonth,
        target_revenue: rev,
        target_orders: parseInt(targetOrders, 10) || 0,
        notes: notes.trim(),
      });
      toast.success('Objectif mensuel enregistré avec succès');
      setDialogOpen(false);
      fetchObjectives();
    } catch {
      toast.error('Erreur lors de l\'enregistrement de l\'objectif');
    } finally {
      setSaving(false);
    }
  };

  const currentMonth = data?.currentMonth;
  const archive = data?.archive || [];

  const getStatusBadge = (status: MonthlyObjectiveData['status'], pct: number) => {
    if (status === 'completed' || pct >= 100) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1 font-semibold text-[11px]">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Atteint ({pct}%)
        </Badge>
      );
    }
    if (status === 'in_progress') {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 gap-1 font-semibold text-[11px]">
          <Clock className="h-3 w-3 text-blue-600 animate-spin" />
          En cours ({pct}%)
        </Badge>
      );
    }
    if (status === 'upcoming') {
      return (
        <Badge variant="outline" className="text-muted-foreground border-border/70 text-[11px]">
          À venir
        </Badge>
      );
    }
    if (status === 'missed') {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 gap-1 font-semibold text-[11px]">
          <AlertCircle className="h-3 w-3 text-rose-600" />
          Non atteint ({pct}%)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground border-dashed text-[11px]">
        Non défini
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Month Active Goal Card */}
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Objectif Mensuel • {currentMonth?.monthName || 'Mois en cours'}
                </CardTitle>
                {currentMonth && getStatusBadge(currentMonth.status, currentMonth.revenuePercentage)}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Suivi en temps réel des ventes (calculé sur le prix unitaire catalogue: Quantité × Prix unitaire)
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleOpenSetObjective(currentMonth)}
            className="gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>{currentMonth?.isConfigured ? "Modifier l'objectif" : "Définir l'objectif"}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !currentMonth?.isConfigured ? (
            <div className="p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Aucun objectif fixé pour ce mois</h4>
                <p className="text-xs text-muted-foreground max-w-md">
                  Définissez un objectif de chiffre d'affaires et de commandes pour {delegateName} afin de mesurer son taux de réalisation mensuel.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenSetObjective(currentMonth)}
                className="gap-2 rounded-xl text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Fixer l'objectif maintenant
              </Button>
            </div>
          ) : (
            <>
              {/* Progress & Percent Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Progression du Chiffre d'Affaires
                  </span>
                  <span className={cn(
                    'text-sm font-extrabold',
                    currentMonth.revenuePercentage >= 100 ? 'text-emerald-600' :
                    currentMonth.revenuePercentage >= 70 ? 'text-blue-600' : 'text-amber-600'
                  )}>
                    {currentMonth.revenuePercentage}%
                  </span>
                </div>

                <div className="relative h-3 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      currentMonth.revenuePercentage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      currentMonth.revenuePercentage >= 70 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' :
                      'bg-gradient-to-r from-amber-500 to-orange-400'
                    )}
                    style={{ width: `${Math.min(100, currentMonth.revenuePercentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Objectif Réalisé: <strong className="text-foreground">{formatFullCurrency(currentMonth.achievedRevenue)}</strong></span>
                  <span>Objectif Fixé: <strong className="text-foreground">{formatFullCurrency(currentMonth.targetRevenue)}</strong></span>
                </div>
              </div>

              {/* 5 Metric Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Objectif Fixé</span>
                  <p className="text-sm font-extrabold text-foreground">{formatCurrency(currentMonth.targetRevenue)}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Obj. Réalisé</span>
                    <span className="text-[9px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">Catalogue</span>
                  </div>
                  <p className="text-sm font-extrabold text-primary">{formatCurrency(currentMonth.achievedRevenue)}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">CA Réalisé</span>
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Ventes</span>
                  </div>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(currentMonth.actualRevenue ?? currentMonth.achievedRevenue)}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Commandes</span>
                  <p className="text-sm font-extrabold text-foreground">
                    {currentMonth.achievedOrders} {currentMonth.targetOrders > 0 ? `/ ${currentMonth.targetOrders}` : 'commandes'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Reste à Réaliser</span>
                  <p className="text-sm font-extrabold text-foreground">
                    {currentMonth.remainingRevenue > 0 ? formatCurrency(currentMonth.remainingRevenue) : '0 DA (Atteint 🎉)'}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Archive Table */}
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Historique & Archives des Objectifs Mensuels
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Bilan mois par mois des quotas, chiffre d'affaires vendu et taux d'atteinte
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenSetObjective()}
            className="gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border-border/60 hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter un Objectif</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {archive.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Aucun historique disponible pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/40">
                    <TableHead className="text-xs font-bold text-left px-4">Mois / Année</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">Objectif Fixé</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">Obj. Réalisé (Catalogue)</TableHead>
                    <TableHead className="text-xs font-bold text-right px-4">CA Réalisé (Ventes)</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">Commandes</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">Taux d'Atteinte</TableHead>
                    <TableHead className="text-xs font-bold text-center px-4">Statut</TableHead>
                    <TableHead className="text-xs font-bold text-center w-20 px-2">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archive.map((m) => (
                    <TableRow key={`${m.year}-${m.month}`} className="hover:bg-muted/20 border-border/40 transition-colors">
                      <TableCell className="font-semibold text-xs text-foreground px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{m.monthName}</span>
                          {m.isCurrent && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary shrink-0">
                              Actuel
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-foreground px-4 py-3.5">
                        {m.targetRevenue > 0 ? formatCurrency(m.targetRevenue) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-primary px-4 py-3.5">
                        {formatCurrency(m.achievedRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400 px-4 py-3.5">
                        {formatCurrency(m.actualRevenue ?? m.achievedRevenue)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-medium px-4 py-3.5">
                        <strong className="text-foreground">{m.achievedOrders}</strong>
                        {m.targetOrders > 0 && <span> / {m.targetOrders}</span>}
                      </TableCell>
                      <TableCell className="text-center px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2 min-w-[110px] mx-auto">
                          <span className={cn(
                            'text-xs font-bold w-10 text-right',
                            m.revenuePercentage >= 100 ? 'text-emerald-600' :
                            m.revenuePercentage >= 70 ? 'text-blue-600' : 'text-amber-600'
                          )}>
                            {m.revenuePercentage}%
                          </span>
                          <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden shrink-0">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                m.revenuePercentage >= 100 ? 'bg-emerald-500' :
                                m.revenuePercentage >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                              )}
                              style={{ width: `${Math.min(100, m.revenuePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4 py-3.5">
                        {getStatusBadge(m.status, m.revenuePercentage)}
                      </TableCell>
                      <TableCell className="text-center w-20 px-2 py-3.5">
                        <div className="flex items-center justify-center mx-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center justify-center"
                            title="Modifier l'objectif"
                            onClick={() => handleOpenSetObjective(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set / Edit Objective Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[580px] w-full rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Target className="h-5 w-5 text-primary" />
              Fixer l'Objectif Mensuel
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Définissez le quota mensuel de chiffre d'affaires et de commandes pour {delegateName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveObjective} className="space-y-5 py-2 w-full">
            {/* Unified Month & Year Date Picker */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Mois Cible (Période)
                </span>
                <span className="text-[10px] text-muted-foreground">Mois en cours & prochains</span>
              </label>

              <Select
                value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                onValueChange={(val) => {
                  if (!val) return;
                  const [y, m] = val.split('-').map(Number);
                  setSelectedYear(y);
                  setSelectedMonth(m);
                }}
              >
                <SelectTrigger className="w-full h-11 rounded-xl text-xs font-semibold px-3.5">
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-72">
                  {generateMonthYearOptions().map((opt) => (
                    <SelectItem
                      key={opt.key}
                      value={opt.key}
                      className={cn(
                        'text-xs py-2 px-3 flex items-center justify-between cursor-pointer',
                        opt.isCurrent && 'font-bold text-primary bg-primary/5',
                        opt.isNext && 'font-semibold text-blue-600'
                      )}
                    >
                      <span>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick shortcuts for Current and Next Months */}
              <div className="flex items-center gap-2 flex-wrap pt-1 w-full">
                <span className="text-[11px] font-medium text-muted-foreground">Raccourcis rapides:</span>
                {generateQuickMonthShortcuts().map((sc) => (
                  <button
                    key={sc.key}
                    type="button"
                    onClick={() => {
                      setSelectedYear(sc.year);
                      setSelectedMonth(sc.month);
                    }}
                    className={cn(
                      'text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all',
                      selectedYear === sc.year && selectedMonth === sc.month
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/50 hover:bg-primary/10 hover:text-primary border-border/60'
                    )}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Revenue Input */}
            <div className="space-y-2 w-full">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Objectif Chiffre d'Affaires (DA) *</span>
                <span className="text-[10px] text-muted-foreground font-normal">Obligatoire</span>
              </label>
              <div className="relative w-full">
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  placeholder="ex: 2000000"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  className="w-full h-11 rounded-xl text-xs font-semibold pr-12 px-3.5"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  DA
                </span>
              </div>

              {/* Quick suggestions */}
              <div className="flex items-center gap-2 pt-1 flex-wrap w-full">
                <span className="text-[11px] font-medium text-muted-foreground">Montants types:</span>
                {[500000, 1000000, 1500000, 2500000, 5000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTargetRevenue(String(val))}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors"
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Orders Input */}
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Objectif Nombre de Commandes</span>
                <span className="text-[10px] text-muted-foreground font-normal">Optionnel</span>
              </label>
              <Input
                type="number"
                min="0"
                placeholder="ex: 50"
                value={targetOrders}
                onChange={(e) => setTargetOrders(e.target.value)}
                className="w-full h-10 rounded-xl text-xs px-3.5"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5 w-full">
              <label className="text-xs font-semibold text-foreground">Remarques / Directives</label>
              <Input
                placeholder="ex: Focus sur les wilayas du centre"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 rounded-xl text-xs px-3.5"
              />
            </div>

            <DialogFooter className="pt-4 gap-3 w-full sm:space-x-0 grid grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full rounded-xl text-xs h-11 border-border/70 hover:bg-muted font-semibold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl text-xs font-semibold gap-2 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer l'objectif
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
