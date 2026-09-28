'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText, CheckCircle2, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { crmQuotesService } from '@/services/crm-quotes';
import type { QuoteKpis } from '@/types/crm-quotes';

interface QuoteKpiCardsProps {
  region?: string;
  userId?: number;
}

export function QuoteKpiCards({ region, userId }: QuoteKpiCardsProps) {
  const [kpis, setKpis] = useState<QuoteKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadKpis = () => {
      crmQuotesService
        .getKpis({
          region: region && region !== 'all' ? region : undefined,
          user_id: userId,
        })
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

    window.addEventListener('sti-crm-quote-updated', loadKpis);

    return () => {
      active = false;
      window.removeEventListener('sti-crm-quote-updated', loadKpis);
    };
  }, [region, userId]);

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

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
      title: 'Devis en Cours',
      value: formatDzd(kpis?.total_active_value || 0),
      subtitle: `${kpis?.active_quotes_count || 0} devis en attente`,
      icon: FileText,
      iconColor: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
    },
    {
      title: 'Devis Acceptés ce mois',
      value: formatDzd(kpis?.accepted_amount_month || 0),
      subtitle: `${kpis?.accepted_count_month || 0} devis validé(s)`,
      icon: CheckCircle2,
      iconColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
    {
      title: 'Commandes Concrétisées',
      value: String(kpis?.converted_count || 0),
      subtitle: 'Devis transformés en commandes',
      icon: ShoppingCart,
      iconColor: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
    },
    {
      title: 'Taux de Validation',
      value: `${kpis?.acceptance_rate || 0}%`,
      subtitle: 'Taux d’acceptation des offres',
      icon: TrendingUp,
      iconColor: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <Card
            key={idx}
            className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                  {it.title}
                </span>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {it.value}
                </div>
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                  it.iconColor
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span className="truncate">{it.subtitle}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
