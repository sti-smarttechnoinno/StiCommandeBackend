'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingCart, CheckCircle, XCircle, Package, User, Activity, Radio, RefreshCw } from 'lucide-react';
import { ordersService, type OrderData } from '@/services/orders';

interface ActivityItem {
  id: string;
  type: 'order_created' | 'order_validated' | 'order_delivered' | 'order_rejected';
  message: string;
  detail: string;
  timestamp: string;
}

const TYPE_CONFIG: Record<ActivityItem['type'], { icon: React.ReactNode; color: string }> = {
  order_created: { icon: <ShoppingCart className="h-3.5 w-3.5" />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  order_validated: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  order_delivered: { icon: <Package className="h-3.5 w-3.5" />, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  order_rejected: { icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
};

export function LiveActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ordersService
      .list({ pageSize: 8, sortField: 'created_at', sortDirection: 'desc' })
      .then((res) => {
        if (active && res.data) {
          const mapped: ActivityItem[] = res.data.map((o: OrderData) => {
            let type: ActivityItem['type'] = 'order_created';
            let msg = `Nouvelle commande ${o.order_code}`;

            if (o.status === 'validated') {
              type = 'order_validated';
              msg = `Commande ${o.order_code} validée`;
            } else if (o.status === 'delivered') {
              type = 'order_delivered';
              msg = `Commande ${o.order_code} livrée`;
            } else if (o.status === 'cancelled') {
              type = 'order_rejected';
              msg = `Commande ${o.order_code} annulée`;
            }

            return {
              id: o.id,
              type,
              message: msg,
              detail: `${o.client_name} • ${o.region}${o.wilaya ? ` (${o.wilaya})` : ''} • ${Number(o.total_amount).toLocaleString('fr-FR')} DA`,
              timestamp: o.created_at || new Date().toISOString(),
            };
          });
          setActivities(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Live Activity</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Derniers événements de commandes en temps réel
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
        {activities.length > 0 ? (
          <div className="space-y-1 flex-1">
            {activities.map((activity, i) => {
              const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.order_created;
              return (
                <div
                  key={activity.id}
                  onClick={() => router.push(`/orders/${activity.id}`)}
                  className="group flex items-start gap-3 p-2 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors relative"
                >
                  {/* Timeline line */}
                  {i < activities.length - 1 && (
                    <div className="absolute left-[19px] top-9 w-[1px] h-[calc(100%-12px)] bg-border/40 z-0" />
                  )}

                  {/* Icon Badge */}
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 z-10 mt-0.5', cfg.color)}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
                        {activity.message}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {activity.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2 my-auto">
            <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">Aucune activité de commande enregistrée</p>
          </div>
        )}

        {/* Card Footer */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> Auto-syncing DB
          </span>
          <span className="font-semibold text-foreground font-mono">{activities.length} Événements DB</span>
        </div>
      </CardContent>
    </Card>
  );
}
