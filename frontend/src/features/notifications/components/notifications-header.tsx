'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNotificationsStore } from '../store';
import { notificationsService } from '@/services/notifications';
import { toast } from 'sonner';
import { Megaphone, CheckCheck, Download, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationsHeader() {
  const { setAnnouncementDialogOpen, triggerRefresh } = useNotificationsStore();
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    toast.info('Refreshing notifications...');
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      triggerRefresh();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
      <div className="space-y-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/notifications" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                notifications
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Notifications Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor live system alerts, order activities, security events, and announcements.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{currentDate}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
        >
          <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Mark All Read</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Exporting notifications report...')}
          className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
        >
          <Download className="h-3.5 w-3.5 text-blue-600" />
          <span>Export</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
          <span>Refresh</span>
        </Button>

        <Button
          size="sm"
          onClick={() => setAnnouncementDialogOpen(true)}
          className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Megaphone className="h-3.5 w-3.5 text-primary-foreground" />
          <span>New Announcement</span>
        </Button>
      </div>
    </div>
  );
}
