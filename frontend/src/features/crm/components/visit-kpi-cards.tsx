'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';
import { crmVisitsService } from '@/services/crm';
import type { CrmVisitKpis } from '@/types/crm';

interface VisitKpiCardsProps {
  region?: string;
}

export function VisitKpiCards({ region }: VisitKpiCardsProps) {
  const [kpis, setKpis] = useState<CrmVisitKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadKpis = () => {
      crmVisitsService
        .getKpis(region && region !== 'all' ? { region } : undefined)
        .then((data) => {
          if (active) {
            setKpis(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    };

    loadKpis();

    window.addEventListener('sti-crm-visit-created', loadKpis);
    window.addEventListener('sti-crm-visit-updated', loadKpis);

    return () => {
      active = false;
      window.removeEventListener('sti-crm-visit-created', loadKpis);
      window.removeEventListener('sti-crm-visit-updated', loadKpis);
    };
  }, [region]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 flex items-center justify-center h-28 border-border/60 bg-card rounded-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Visites Aujourd'hui",
      value: kpis?.todayPlanned ?? 0,
      subValue: `${kpis?.todayCompleted ?? 0} réalisée(s)`,
      icon: Calendar,
      iconColor: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      title: 'Réalisées ce mois',
      value: kpis?.monthCompleted ?? 0,
      subValue: 'Visites avec compte-rendu certifié',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      title: 'Planifiées ce mois',
      value: kpis?.monthPlanned ?? 0,
      subValue: 'Tournées programmées',
      icon: Clock,
      iconColor: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    },
    {
      title: 'Taux de Réalisation',
      value: `${kpis?.completionRate ?? 0}%`,
      subValue: (kpis?.completionRate ?? 0) >= 75 ? 'Excellente cadence' : 'En cours de tournée',
      icon: TrendingUp,
      iconColor: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card
            key={index}
            className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                  {item.title}
                </span>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {item.value}
                </div>
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                  item.iconColor
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span className="truncate">{item.subValue}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
