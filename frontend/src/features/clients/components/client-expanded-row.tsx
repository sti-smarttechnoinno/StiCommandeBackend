'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { ClientStatusBadge, ClientTypeBadge } from './client-badges';
import type { ClientData } from '@/services/clients';
import {
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Target,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface ClientExpandedRowProps {
  client: ClientData;
}

export function ClientExpandedRow({ client }: ClientExpandedRowProps) {
  const router = useRouter();

  const obj = client.objective;
  const isObjectiveConfigured = Boolean(obj && obj.isConfigured && obj.targetRevenue > 0);

  const rawDelegate = client.delegateName;
  const isDelegateUnassigned = !rawDelegate || rawDelegate.trim().toLowerCase() === 'unassigned';

  return (
    <div className="p-4 bg-muted/20 border-t border-border/30">
      <Card className="border border-border/40 shadow-xs bg-card/90 backdrop-blur-sm rounded-xl overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Top Header Summary */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">{client.name}</h4>
                  <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    {client.clientCode}
                  </span>
                  <ClientStatusBadge status={client.status} />
                  <ClientTypeBadge type={client.clientType} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Client registered on {new Date(client.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 rounded-lg"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Profile
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => router.push(`/orders/new?clientId=${client.id}`)}
              >
                <Plus className="h-3.5 w-3.5" />
                New Order
              </Button>
            </div>
          </div>

          {/* Detailed Info Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Contact & Geographic Details */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Contact & Location</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-foreground font-medium">{client.phone || 'No phone'}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-foreground truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-muted-foreground pt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground/70 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground leading-snug">
                    {client.address || 'Address not specified'}
                    {client.wilaya ? `, ${client.wilaya}` : ''}
                    {client.region ? ` (${client.region})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Monthly Objective */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <span>Objective ({obj?.monthName || 'Current Month'})</span>
                </div>
                {isObjectiveConfigured && (
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {obj!.revenuePercentage.toFixed(0)}%
                  </span>
                )}
              </div>

              {isObjectiveConfigured ? (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        obj!.revenuePercentage >= 100
                          ? 'bg-emerald-500'
                          : obj!.revenuePercentage >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(obj!.revenuePercentage, 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-muted-foreground block">Target Revenue</span>
                      <strong className="text-foreground font-semibold">{formatCurrency(obj!.targetRevenue)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Achieved Revenue</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(obj!.achievedRevenue)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Target Orders</span>
                      <strong className="text-foreground font-semibold">{obj!.targetOrders || 0}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Achieved Orders</span>
                      <strong className="text-foreground font-semibold">{obj!.achievedOrders || 0}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-1">
                  <p className="text-xs text-muted-foreground italic">There is no objective setted yet</p>
                  <p className="text-[10px] text-muted-foreground/70">No monthly target assigned for this client</p>
                </div>
              )}
            </div>

            {/* Column 3: Commercial & Order Activity */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Commercial Assignment</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delegate:</span>
                  {isDelegateUnassigned ? (
                    <span className="text-xs text-muted-foreground font-medium">Unassigned</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {rawDelegate.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{rawDelegate}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Orders:</span>
                  <strong className="text-foreground font-semibold">{client.totalOrders || 0} orders</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Spent:</span>
                  <strong className="text-foreground font-semibold">{formatCurrency(client.totalSpent || 0)}</strong>
                </div>

                {client.lastOrderDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Order:</span>
                    <span className="text-foreground font-medium">
                      {new Date(client.lastOrderDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {client.notes && (
                  <div className="pt-1 text-[11px] text-muted-foreground italic border-t border-border/30 line-clamp-2">
                    &ldquo;{client.notes}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
