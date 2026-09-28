'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UserPlus, UserCheck, Users, Target, Loader2 } from 'lucide-react';
import { crmLeadsService } from '@/services/crm-pipeline';

interface LeadKpiCardsProps {
  region?: string;
  userId?: number;
}

export function LeadKpiCards({ region, userId }: LeadKpiCardsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    qualifiedCount: 0,
    convertedCount: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    let active = true;

    const loadStats = () => {
      crmLeadsService
        .list({
          per_page: 250,
          region: region && region !== 'all' ? region : undefined,
          user_id: userId,
        })
        .then((res) => {
          if (!active) return;
          const leads = res.data || [];
          const total = res.total || leads.length;
          const newCount = leads.filter((l) => l.status === 'new').length;
          const qualifiedCount = leads.filter((l) => l.status === 'qualified').length;
          const convertedCount = leads.filter((l) => l.status === 'converted').length;
          const rate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;

          setStats({
            total,
            newCount,
            qualifiedCount,
            convertedCount,
            conversionRate: rate,
          });
          setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    };

    loadStats();
    window.addEventListener('sti-crm-lead-updated', loadStats);

    return () => {
      active = false;
      window.removeEventListener('sti-crm-lead-updated', loadStats);
    };
  }, [region, userId]);

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
      title: 'Total Prospects',
      value: stats.total,
      subtitle: 'Portefeuille de cibles',
      icon: Users,
      iconColor: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    },
    {
      title: 'Nouveaux Leads',
      value: stats.newCount,
      subtitle: 'À contacter en priorité',
      icon: UserPlus,
      iconColor: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
    },
    {
      title: 'Prospects Qualifiés',
      value: stats.qualifiedCount,
      subtitle: 'Besoins et budget identifiés',
      icon: Target,
      iconColor: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    },
    {
      title: 'Convertis en Clients',
      value: stats.convertedCount,
      subtitle: `Taux de conversion : ${stats.conversionRate}%`,
      icon: UserCheck,
      iconColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
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
