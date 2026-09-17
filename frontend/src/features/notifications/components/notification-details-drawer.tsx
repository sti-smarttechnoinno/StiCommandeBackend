'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { MOCK_NOTIFICATIONS } from '../mock-data';
import { useNotificationsStore } from '../store';
import { ordersService } from '@/services/orders';
import { getCategoryColor, getPriorityColor, getStatusColor, getStatusDot, getStatusLabel } from '../utils';
import { toast } from 'sonner';
import {
  X, Eye, CheckCheck, Archive, Trash2, ExternalLink, UserPlus,
  ShoppingCart, Package, Users, Shield, Server, FileText, DollarSign, UserCheck,
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

const TIMELINE_STEPS = ['Created', 'Viewed', 'Assigned', 'Resolved', 'Archived'];

export function NotificationDetailsDrawer() {
  const router = useRouter();
  const { isDetailsDrawerOpen, setDetailsDrawerOpen, selectedNotificationId } = useNotificationsStore();
  const notification = MOCK_NOTIFICATIONS.find((n) => n.id === selectedNotificationId);

  if (!notification) return null;

  return (
    <Drawer open={isDetailsDrawerOpen} onOpenChange={(open) => setDetailsDrawerOpen(open)}>
      <DrawerContent className="max-w-[520px]">
        <DrawerHeader className="border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">Notification Details</DrawerTitle>
            <button onClick={() => setDetailsDrawerOpen(false)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>

        <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', getCategoryColor(notification.category))}>
              {CATEGORY_ICONS[notification.category]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={cn('text-[9px] font-bold px-1.5 py-0 rounded-full border-0', getPriorityColor(notification.priority))}>
                  {notification.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={cn('text-[9px] font-bold px-1.5 py-0 rounded-full border-0', getCategoryColor(notification.category))}>
                  {notification.category}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{notification.title}</h3>
              <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
            <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">{notification.description}</p>
          </div>

          {/* Related Information */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Related Information</h4>
            <div className="grid grid-cols-2 gap-2">
              {notification.referenceId && (
                <div className="p-3 rounded-xl bg-muted/30">
                  <span className="text-[10px] text-muted-foreground block mb-0.5">Reference</span>
                  <span className="text-xs font-semibold text-foreground font-mono">{notification.referenceId}</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Module</span>
                <span className="text-xs font-semibold text-foreground">{notification.module}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Region</span>
                <span className="text-xs font-semibold text-foreground">{notification.region}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Status</span>
                <span className={cn('text-xs font-semibold flex items-center gap-1', getStatusColor(notification.status))}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(notification.status))} />
                  {getStatusLabel(notification.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h4>
            <div className="space-y-3">
              {TIMELINE_STEPS.map((step, i) => {
                const isActive = i === 0;
                const isCompleted = i <= 1;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold', isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <span className={cn('text-xs font-semibold', isCompleted ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
                      {isActive && <span className="text-[10px] text-muted-foreground ml-2">— Just now</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned User */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Assigned To</h4>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">SY</AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs font-semibold text-foreground block">System</span>
                <span className="text-[10px] text-muted-foreground">Auto-assigned</span>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto h-7 rounded-lg" onClick={() => toast.info('Reassigning...')}>
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-semibold border-border/60"
            onClick={async () => {
              const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              let uuid: string | null = null;

              if (notification.orderId && UUID_REGEX.test(notification.orderId.trim())) {
                uuid = notification.orderId.trim();
              } else if (notification.referenceId && UUID_REGEX.test(notification.referenceId.trim())) {
                uuid = notification.referenceId.trim();
              } else {
                const fullText = `${notification.title} ${notification.description} ${notification.referenceId || ''}`;
                const match = fullText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                if (match && UUID_REGEX.test(match[0])) {
                  uuid = match[0];
                } else {
                  const codeMatch = fullText.match(/ORD-[\w-]+/i);
                  if (codeMatch) {
                    try {
                      const res = await ordersService.list({ search: codeMatch[0] });
                      const found = res.data.find(
                        (o) => o.order_code?.toLowerCase() === codeMatch[0].toLowerCase() && UUID_REGEX.test(o.id)
                      );
                      if (found) uuid = found.id;
                    } catch {
                      // Lookup failed
                    }
                  }
                }
              }

              const isOrder = notification.category === 'orders' || notification.module?.toLowerCase() === 'orders' || Boolean(uuid);
              if (isOrder) {
                setDetailsDrawerOpen(false);
                if (uuid) {
                  router.push(`/orders/${uuid}`);
                } else {
                  router.push('/orders');
                }
              } else {
                toast.info('Opening related record');
              }
            }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open Record
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-xs font-semibold border-border/60" onClick={() => toast.success('Marked as read')}>
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" /> Mark Read
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-xs font-semibold border-border/60" onClick={() => toast.success('Resolved')}>
            <Archive className="h-3.5 w-3.5 mr-1.5" /> Resolve
          </Button>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-border/60 text-rose-600" onClick={() => toast.error('Deleted')}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
