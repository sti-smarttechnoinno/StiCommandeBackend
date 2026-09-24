'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  Wallet,
  UserCheck,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import type { SalesJournalKpis } from '@/services/sales-journal';

interface KPIData {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  subtext?: string;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'red' | 'indigo' | 'teal' | 'amber';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
} as const;

function formatValue(val: number, prefix: string, suffix: string) {
  if (val >= 1000000000) return prefix + (val / 1000000000).toFixed(2) + 'B' + suffix;
  if (val >= 1000000) return prefix + (val / 1000000).toFixed(2) + 'M' + suffix;
  if (val >= 1000) return prefix + val.toLocaleString('fr-FR') + suffix;
  return prefix + String(val) + suffix;
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(() => formatValue(target, prefix, suffix));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const duration = 1000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      setDisplay(formatValue(current, prefix, suffix));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, prefix, suffix]);

  return <span>{display}</span>;
}

interface SalesJournalKPICardsProps {
  kpis: SalesJournalKpis;
  loading: boolean;
}

export function SalesJournalKPICards({ kpis, loading }: SalesJournalKPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const cards: KPIData[] = [
    {
      title: 'Chiffre d’Affaires TTC',
      value: kpis.totalTtc,
      suffix: ' DA',
      subtext: `HT : ${(kpis.totalNetHt / 1000000).toFixed(1)}M DA`,
      icon: <ShoppingCart className="h-5 w-5" />,
      iconColor: 'blue',
      sparkline: [12, 19, 15, 22, 28, 32, 38],
      sparkColor: '#2563EB',
    },
    {
      title: 'Total Réglé (Paiement)',
      value: kpis.totalPaid,
      suffix: ' DA',
      subtext: `Taux : ${kpis.recoveryRate}%`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconColor: 'green',
      sparkline: [5, 8, 12, 14, 18, 20, 25],
      sparkColor: '#22C55E',
    },
    {
      title: 'Reste à Payer (Créances)',
      value: kpis.totalRemaining,
      suffix: ' DA',
      subtext: 'Solde en attente',
      icon: <Clock className="h-5 w-5" />,
      iconColor: 'red',
      sparkline: [30, 28, 25, 24, 22, 21, 20],
      sparkColor: '#F43F5E',
    },
    {
      title: 'Rapprochement STI',
      value: kpis.matchRate,
      suffix: '%',
      subtext: `${kpis.matchedCount.toLocaleString()} / ${kpis.totalOperations.toLocaleString()} liées`,
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: 'indigo',
      sparkline: [80, 85, 90, 92, 95, 98, kpis.matchRate || 99],
      sparkColor: '#6366F1',
    },
    {
      title: 'Pièces de Vente',
      value: kpis.totalOperations,
      subtext: `${kpis.unmatchedCount} non réconciliées`,
      icon: <FileSpreadsheet className="h-5 w-5" />,
      iconColor: 'teal',
      sparkline: [100, 250, 500, 1200, 3500, 6000, kpis.totalOperations || 9913],
      sparkColor: '#14B8A6',
    },
    {
      title: 'Taux de Recouvrement',
      value: kpis.recoveryRate,
      suffix: '%',
      subtext: kpis.totalTtc > 0 ? 'Paiement / TTC' : 'Aucune vente',
      icon: <Wallet className="h-5 w-5" />,
      iconColor: 'amber',
      sparkline: [0, 1, 2, 2, 3, 3, kpis.recoveryRate || 1],
      sparkColor: '#F59E0B',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="p-4 relative overflow-hidden border-border/40 hover:border-border/80 transition-all duration-200 bg-card shadow-xs hover:shadow-sm flex flex-col justify-between"
        >
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground truncate mr-2">{card.title}</span>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[card.iconColor])}>
              {card.icon}
            </div>
          </div>

          {/* Value */}
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground truncate">
              <CountUp target={card.value} prefix={card.prefix} suffix={card.suffix} />
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
              <span className="text-[11px] font-medium text-muted-foreground truncate">{card.subtext}</span>
              {card.sparkline && card.sparkColor && (
                <div className="w-16 h-6 flex-shrink-0">
                  <Sparkline data={card.sparkline} color={card.sparkColor} />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
