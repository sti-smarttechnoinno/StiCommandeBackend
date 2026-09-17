'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MOCK_SYSTEM_HEALTH, MOCK_CONNECTED_USERS } from '../mock-data';
import { Activity, Wifi, Clock } from 'lucide-react';

export function SystemHealthWidget() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          System Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-2.5">
          {MOCK_SYSTEM_HEALTH.map((service) => (
            <div key={service.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">{service.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">{service.latency} ms</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Operational</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Latency</span>
              <span className="text-xs font-bold text-foreground">18 ms</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Connected</span>
              <span className="text-xs font-bold text-foreground">{MOCK_CONNECTED_USERS} users</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
