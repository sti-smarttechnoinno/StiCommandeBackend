'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usersService, type UserAnalyticsResponse } from '@/services/users';
import { getEventColor, getEventDot } from '../utils';
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  'Successful Login': <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  Login: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  Logout: <Clock className="h-3 w-3 text-muted-foreground" />,
  'Password Changed': <AlertTriangle className="h-3 w-3 text-amber-500" />,
  'Role Updated': <AlertTriangle className="h-3 w-3 text-amber-500" />,
  'Failed Login': <XCircle className="h-3 w-3 text-rose-500" />,
};

export function SecurityEventsCard() {
  const [analytics, setAnalytics] = useState<UserAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    usersService
      .getAnalytics()
      .then((res) => {
        if (!cancelled) {
          setAnalytics(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="border border-border/40 shadow-xs rounded-2xl p-6 flex items-center justify-center bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const events = analytics?.securityEvents || [];

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card flex flex-col justify-start">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span>Security Events Log</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Live Audit
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3 flex-1">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No recent security events</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  {EVENT_ICONS[event.event] || <Clock className="h-3 w-3 text-muted-foreground" />}
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground block truncate">{event.user}</span>
                    <span className="text-[10px] text-muted-foreground">{event.event} · {event.time}</span>
                  </div>
                </div>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold flex-shrink-0', getEventColor(event.status))}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', getEventDot(event.status))} />
                  {event.status === 'success' ? 'Success' : event.status === 'warning' ? 'Warning' : 'Danger'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
