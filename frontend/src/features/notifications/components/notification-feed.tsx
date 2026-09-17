'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotificationsStore } from '../store';
import { notificationsService } from '@/services/notifications';
import type { Notification } from '../types';
import { getCategoryColor, getPriorityColor, getPriorityBorder } from '../utils';
import { toast } from 'sonner';
import {
  Eye,
  CheckCheck,
  Trash2,
  ShoppingCart,
  Package,
  Users,
  Shield,
  Server,
  FileText,
  DollarSign,
  UserCheck,
  BellOff,
  Radio,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  orders: <ShoppingCart className="h-4 w-4" />,
  stock: <Package className="h-4 w-4" />,
  delegates: <UserCheck className="h-4 w-4" />,
  clients: <Users className="h-4 w-4" />,
  reports: <FileText className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  system: <Server className="h-4 w-4" />,
  finance: <DollarSign className="h-4 w-4" />,
};

function formatTimeAgo(timestamp: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

function NotificationCard({ notification, onRead }: { notification: Notification; onRead: () => void }) {
  const { setDetailsDrawerOpen } = useNotificationsStore();

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsService.markAsRead(notification.id);
      toast.success('Marked as read');
      onRead();
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsService.delete(notification.id);
      toast.success('Notification deleted');
      onRead();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const isCritical = notification.priority === 'critical';
  const isHigh = notification.priority === 'high';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group overflow-hidden',
        !notification.read
          ? 'bg-gradient-to-r from-primary/[0.04] via-card to-card border-primary/30 shadow-xs hover:border-primary/50'
          : 'bg-card/70 border-border/40 hover:bg-muted/30 hover:border-border/70 hover:shadow-sm'
      )}
      onClick={() => setDetailsDrawerOpen(true, notification.id)}
    >
      {/* Priority accent side indicator */}
      <span
        className={cn(
          'absolute left-0 top-3 bottom-3 w-1 rounded-r-full',
          isCritical
            ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
            : isHigh
            ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
            : !notification.read
            ? 'bg-primary shadow-xs shadow-primary/50'
            : 'bg-transparent'
        )}
      />

      {/* Category Icon Squircle */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border transition-transform duration-200 group-hover:scale-105',
          getCategoryColor(notification.category)
        )}
      >
        {CATEGORY_ICONS[notification.category] ?? <Server className="h-4 w-4" />}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pl-0.5">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-extrabold px-2 py-0.2 rounded-full border-0 uppercase tracking-wider',
              getPriorityColor(notification.priority)
            )}
          >
            {notification.priority}
          </Badge>
          <span className="text-[10px] font-semibold text-muted-foreground capitalize">
            {notification.category}
          </span>
          {!notification.read && (
            <span className="relative flex h-2 w-2 ml-auto sm:ml-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </div>

        <h4 className="text-xs font-bold text-foreground mb-0.5 leading-snug group-hover:text-primary transition-colors line-clamp-1">
          {notification.title}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {notification.description}
        </p>

        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground/70 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatTimeAgo(notification.timestamp)}
          </span>
          {notification.region && (
            <>
              <span>&bull;</span>
              <span>{notification.region}</span>
            </>
          )}
        </div>
      </div>

      {/* Hover Action Buttons */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setDetailsDrawerOpen(true, notification.id)}
          title="View Details"
        >
          <Eye className="h-3 w-3" />
        </Button>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
            onClick={handleMarkRead}
            title="Mark as Read"
          >
            <CheckCheck className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationFeed() {
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const triggerRefresh = useNotificationsStore((s) => s.triggerRefresh);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const res = await notificationsService.list({ pageSize: 6 });
      setNotifications(res.data);
    } catch {
      // Empty feed fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [refreshKey]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      toast.success('All notifications marked as read');
      triggerRefresh();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card className="border border-border/50 shadow-xs hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-card flex flex-col justify-start relative group/card">
      {/* Top ambient glow line */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

      <CardHeader className="p-5 pb-3.5 border-b border-border/30 bg-muted/15 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2.5">
            <div className="relative flex items-center justify-center h-4 w-4">
              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs shadow-emerald-500" />
            </div>
            <span>Live Notification Feed</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {unreadCount} new
              </span>
            )}
          </CardTitle>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-full text-[11px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              Mark all
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">Streaming live alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center space-y-2.5 text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/40">
              <BellOff className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-bold text-foreground">All caught up</p>
            <p className="text-[11px] text-muted-foreground max-w-[200px]">
              No new alerts right now. Incoming events will stream here live.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-0.5 scrollbar-thin">
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onRead={triggerRefresh} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
