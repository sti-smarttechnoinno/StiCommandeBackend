'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notificationsService } from '@/services/notifications';
import type { Notification } from '@/features/notifications/types';
import { cn } from '@/lib/utils';
import { ShoppingCart, AlertTriangle, User, Server, Bell, ArrowRight, CheckCheck, BellOff } from 'lucide-react';
import Link from 'next/link';

const NOTIF_ICONS: Record<string, { icon: any; color: string }> = {
  orders: { icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  stock: { icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  delegates: { icon: User, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  system: { icon: Server, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .list({ pageSize: 5 })
      .then((res) => {
        if (isMounted) {
          setNotifications(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Bell className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Recent Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary border-none">
                  {unreadCount} New
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live alerts and system activity updates
            </CardDescription>
          </div>
        </div>

        <Link href="/notifications">
          <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-1">
        {loading ? (
          <div className="space-y-2.5 p-2 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 flex-1 my-auto min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground shadow-2xs">
              <BellOff className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">No Recent Notifications</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                You&apos;re all caught up! Order alerts, stock alerts and delegate updates will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 flex-1">
            {notifications.map((n) => {
              const notifConfig = NOTIF_ICONS[n.category] || NOTIF_ICONS.orders;
              const Icon = notifConfig.icon;
              const color = notifConfig.color;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-muted/40',
                    n.read ? 'opacity-80' : 'bg-muted/20 font-medium'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
                        {n.timestamp ? n.timestamp : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                      {n.description}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Card Footer Action */}
        <div className="pt-3 mt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> All systems operational
          </span>
          <Link href="/notifications" className="font-semibold text-primary hover:underline">
            Mark all read
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
