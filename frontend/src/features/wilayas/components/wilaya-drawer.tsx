'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompactCurrency, getPerformanceColor, getPerformanceLabel, getStatusColor, getStatusDot, getStatusLabel, getRegionColor, getGrowthColor } from '../utils';
import { wilayasService } from '@/services/wilayas';
import type { WilayaRow } from '../types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { X, MapPin, Phone, Mail, Users, ShoppingCart, DollarSign, TrendingUp, FileText, Eye, Loader2 } from 'lucide-react';

interface WilayaDrawerProps {
  wilayaId: string | null;
  onClose: () => void;
}

export function WilayaDrawer({ wilayaId, onClose }: WilayaDrawerProps) {
  const [wilaya, setWilaya] = useState<WilayaRow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!wilayaId) {
      setWilaya(null);
      return;
    }

    setLoading(true);
    wilayasService
      .get(wilayaId)
      .then((data) => {
        setWilaya(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [wilayaId]);

  return (
    <Drawer open={!!wilayaId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-[480px] max-w-[480px]">
        {loading || !wilaya ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <DrawerHeader className="border-b border-border/40 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DrawerTitle className="text-lg font-bold text-foreground">{wilaya.name}</DrawerTitle>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Code {wilaya.code}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', getRegionColor(wilaya.regionId))}>
                        {wilaya.regionName}
                      </span>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', getPerformanceColor(wilaya.performance))}>
                        {getPerformanceLabel(wilaya.performance)}
                      </span>
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
                      <p className="text-xs text-muted-foreground">No delegate assigned</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* KPI Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground block">{formatCompactCurrency(wilaya.monthlyRevenue)}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Monthly Revenue</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground block">{wilaya.ordersMonth.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Orders/Month</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground block">{wilaya.clients}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Clients</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className={cn('text-lg font-bold block', getGrowthColor(wilaya.growth))}>{wilaya.growth >= 0 ? '+' : ''}{wilaya.growth}%</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Growth</span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Performance Score</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Score</span>
                    <span className="text-sm font-bold text-foreground">{wilaya.performanceScore}%</span>
                  </div>
                  <Progress
                    value={wilaya.performanceScore}
                    className="h-2.5"
                    indicatorClassName={cn(
                      'transition-all duration-500',
                      wilaya.performanceScore >= 90 ? 'bg-emerald-500' :
                      wilaya.performanceScore >= 75 ? 'bg-blue-500' :
                      wilaya.performanceScore >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                  />
                </div>
              </div>

              {/* Revenue Trend */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Revenue Trend (12 Months)</h4>
                <Card className="border border-border/40 shadow-xs rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-end gap-1 h-20">
                      {(wilaya.revenueTrend || []).map((val, i) => {
                        const max = Math.max(...(wilaya.revenueTrend || [1]));
                        const height = max > 0 ? (val / max) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-primary/20 hover:bg-primary/40 transition-colors"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
                      <span>Jan</span>
                      <span>Jun</span>
                      <span>Dec</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Avg Order Value</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(wilaya.avgOrder)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Yearly Revenue</span>
                    <span className="text-sm font-semibold text-foreground">{formatCompactCurrency(wilaya.yearlyRevenue)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Top Product</span>
                    <span className="text-sm font-semibold text-foreground">{wilaya.topProduct}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Last Activity</span>
                    <span className="text-sm font-semibold text-foreground">{wilaya.lastActivity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border/40 p-4 flex items-center gap-2">
              <Button className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Eye className="h-3.5 w-3.5" /> View Orders
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 border-border/60">
                <Users className="h-3.5 w-3.5" /> View Clients
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 border-border/60">
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
