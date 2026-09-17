'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatFullCurrency, formatFullDate, getPerformanceLevel } from '../utils';
import { DelegateStatusBadge } from './delegate-status-badge';
import { delegatesService, type DelegateData } from '@/services/delegates';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Mail, Phone, Calendar, MapPin, Users, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DelegateProfileDrawerProps {
  delegateId: string | null;
  onClose: () => void;
}

export function DelegateProfileDrawer({ delegateId, onClose }: DelegateProfileDrawerProps) {
  const [delegate, setDelegate] = useState<DelegateData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!delegateId) {
      setDelegate(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    delegatesService
      .get(delegateId)
      .then((data) => {
        if (!cancelled) {
          setDelegate(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [delegateId]);

  if (!delegateId) return null;

  const perfLevel = delegate ? getPerformanceLevel(delegate.completionRate) : null;

  return (
    <Drawer open={!!delegateId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-[450px] max-w-[450px]">
        {loading || !delegate ? (
          <div className="p-8 flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DrawerHeader className="border-b border-border/40 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {delegate.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DrawerTitle className="text-lg font-bold text-foreground">{delegate.name}</DrawerTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <DelegateStatusBadge
                        status={delegate.status as any}
                        lastActivity={delegate.lastActivity}
                      />
                      <span className="text-xs text-muted-foreground">{delegate.region}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DrawerHeader>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-150px)]">
              {/* Contact Card */}
              <Card className="border-border/40 bg-card">
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">{delegate.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">{delegate.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">{delegate.wilaya || delegate.region}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Member since {formatFullDate(delegate.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="border-border/40 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
                        <span>Total Orders</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{delegate.totalOrders}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Revenue</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatFullCurrency(delegate.totalRevenue)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Completion Rate</span>
                      <span className="font-bold" style={{ color: perfLevel?.color }}>{delegate.completionRate}%</span>
                    </div>
                    <Progress value={delegate.completionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Clients */}
              <Card className="border-border/40 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Assigned Clients
                    </CardTitle>
                    <span className="text-xs font-semibold text-primary">{delegate.clientCount ?? 0} Clients</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Assigned to customer accounts in {delegate.region} region.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
