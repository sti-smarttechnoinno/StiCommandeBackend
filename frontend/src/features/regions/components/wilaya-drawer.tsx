'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrency, formatFullCurrency, getStatusColor, getStatusDot, getStatusLabel } from '../utils';
import { mockAllWilayas } from '../mock-data';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { X, MapPin, Phone, Mail, Users, ShoppingCart, DollarSign, Activity, TrendingUp, Clock, Pencil, UserPlus, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WilayaDrawerProps {
  wilayaId: string | null;
  onClose: () => void;
}

const ACTIVITY_TIMELINE = [
  { id: '1', action: 'New client registered', detail: 'Telecom Plus DZ', time: '2h ago', type: 'client' },
  { id: '2', action: 'Order delivered', detail: 'ORD-2026-0842', time: '3h ago', type: 'order' },
  { id: '3', action: 'Delegate assigned', detail: 'Ahmed Benali', time: '5h ago', type: 'delegate' },
  { id: '4', action: 'Revenue milestone', detail: '2M DA reached', time: '1d ago', type: 'revenue' },
  { id: '5', action: 'Coverage updated', detail: '98% coverage', time: '2d ago', type: 'coverage' },
];

const ACTIVITY_COLORS: Record<string, { bg: string; icon: string }> = {
  client: { bg: 'bg-blue-500/10', icon: 'text-blue-600' },
  order: { bg: 'bg-emerald-500/10', icon: 'text-emerald-600' },
  delegate: { bg: 'bg-purple-500/10', icon: 'text-purple-600' },
  revenue: { bg: 'bg-amber-500/10', icon: 'text-amber-600' },
  coverage: { bg: 'bg-teal-500/10', icon: 'text-teal-600' },
};

export function WilayaDrawer({ wilayaId, onClose }: WilayaDrawerProps) {
  const wilaya = mockAllWilayas.find((w) => w.id === wilayaId);

  if (!wilaya) return null;

  return (
    <Drawer open={!!wilayaId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-[450px] max-w-[450px]">
        <DrawerHeader className="border-b border-border/40 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DrawerTitle className="text-lg font-bold text-foreground">{wilaya.name}</DrawerTitle>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Wilaya {wilaya.code}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{wilaya.regionName} Region</span>
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', getStatusColor(wilaya.status))}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(wilaya.status))} />
                    {getStatusLabel(wilaya.status)}
                  </span>
                </div>
              </div>
            </div>
            <DrawerClose className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Delegate Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Assigned Delegate</h4>
            {wilaya.delegate ? (
              <Card className="border border-border/40 shadow-xs rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-full">
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary rounded-full">
                        {wilaya.delegate.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{wilaya.delegate.name}</p>
                      <p className="text-xs text-muted-foreground">{wilaya.delegate.role}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Phone className="h-3 w-3" /> {wilaya.delegate.phone}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3" /> {wilaya.delegate.email}
                      </span>
                    </div>
                    <div className={cn('w-3 h-3 rounded-full flex-shrink-0', wilaya.delegate.isOnline ? 'bg-emerald-500' : 'bg-slate-300')} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed border-border/60 shadow-none rounded-xl">
                <CardContent className="p-4 text-center">
                  <UserPlus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No delegate assigned</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Statistics</h4>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border border-border/40 shadow-xs rounded-xl">
                <CardContent className="p-3 text-center">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-lg font-bold text-foreground block">{wilaya.clients}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Clients</span>
                </CardContent>
              </Card>
              <Card className="border border-border/40 shadow-xs rounded-xl">
                <CardContent className="p-3 text-center">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-lg font-bold text-foreground block">{wilaya.ordersToday}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Orders Today</span>
                </CardContent>
              </Card>
              <Card className="border border-border/40 shadow-xs rounded-xl">
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-lg font-bold text-foreground block">{formatCurrency(wilaya.revenue)}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Revenue</span>
                </CardContent>
              </Card>
              <Card className="border border-border/40 shadow-xs rounded-xl">
                <CardContent className="p-3 text-center">
                  <Activity className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <span className="text-lg font-bold text-foreground block">{wilaya.coverage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Coverage</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coverage Progress */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Coverage Progress</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Territory Coverage</span>
                <span className="text-sm font-bold text-foreground">{wilaya.coverage}%</span>
              </div>
              <Progress
                value={wilaya.coverage}
                className="h-2"
                indicatorClassName={cn(
                  'transition-all duration-500',
                  wilaya.coverage >= 80 ? 'bg-emerald-500' : wilaya.coverage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                )}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Activity</h4>
            <div className="space-y-0">
              {ACTIVITY_TIMELINE.map((activity, i) => {
                const cfg = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.client;
                return (
                  <div key={activity.id} className="flex gap-3 relative">
                    {i < ACTIVITY_TIMELINE.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-[1px] h-full bg-border/40" />
                    )}
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10', cfg.bg)}>
                      <Activity className={cn('h-3 w-3', cfg.icon)} />
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{activity.action}</p>
                      <p className="text-[11px] text-muted-foreground">{activity.detail}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/40 p-4 flex items-center gap-2">
          <Button className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Pencil className="h-3.5 w-3.5" /> Edit Wilaya
          </Button>
          <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 border-border/60">
            <UserPlus className="h-3.5 w-3.5" /> Assign Delegate
          </Button>
          <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 border-border/60">
            <Eye className="h-3.5 w-3.5" /> View Clients
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
