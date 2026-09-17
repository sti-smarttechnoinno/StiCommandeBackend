'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { notificationsService } from '@/services/notifications';
import { useNotificationsStore } from '../store';
import type { Announcement } from '../types';
import { Megaphone, Plus, CheckCircle2, Clock, ChevronRight, Calendar, Radio } from 'lucide-react';

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  scheduled: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    dot: 'bg-blue-500',
  },
  published: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  draft: {
    badge: 'bg-muted text-muted-foreground border border-border/60',
    dot: 'bg-muted-foreground',
  },
};

export function AnnouncementsCard() {
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const setAnnouncementDialogOpen = useNotificationsStore((s) => s.setAnnouncementDialogOpen);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .getAnnouncements()
      .then((res) => {
        if (isMounted) {
          setAnnouncements(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return (
    <Card className="border border-border/50 shadow-xs hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card flex flex-col justify-start relative group/card">
      {/* Top ambient glow line */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

      <CardHeader className="p-5 pb-3.5 border-b border-border/30 bg-muted/15 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
              <Megaphone className="h-4 w-4" />
            </div>
            <span>System Announcements</span>
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 rounded-full text-xs font-semibold gap-1 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setAnnouncementDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">No announcements yet</p>
              <p className="text-[11px] text-muted-foreground max-w-[210px] mt-0.5">
                Broadcast critical updates and system maintenance notices to all users.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
              onClick={() => setAnnouncementDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Announcement
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-0.5 scrollbar-thin">
            {announcements.map((ann) => {
              const statusCfg = STATUS_STYLES[ann.status] ?? STATUS_STYLES.published;
              return (
                <div
                  key={ann.id}
                  className="relative flex items-start gap-3 p-3.5 rounded-2xl border border-border/40 bg-gradient-to-br from-card to-muted/20 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border transition-transform duration-200 group-hover:scale-105',
                      ann.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : ann.status === 'scheduled'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-muted text-muted-foreground border-border/60'
                    )}
                  >
                    {ann.status === 'published' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {ann.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-bold px-2 py-0.2 rounded-full capitalize flex-shrink-0 flex items-center gap-1',
                          statusCfg.badge
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                        {ann.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        {ann.date}
                      </span>
                      <span>&bull;</span>
                      <span className="text-primary/90 font-semibold">Broadcasting</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-primary transition-all flex-shrink-0 self-center" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
