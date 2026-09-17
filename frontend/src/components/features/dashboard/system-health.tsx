'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSystemStatus } from '@/constants/mock-data';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export function SystemHealth() {
  const status = getSystemStatus();

  const services = [
    { name: 'API', ...status.api },
    { name: 'Database', ...status.database },
    { name: 'Redis', ...status.redis },
    { name: 'Storage', ...status.storage },
    { name: 'Socket.IO', ...status.socketIO },
    { name: 'Background Jobs', ...status.backgroundJobs },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5 text-[13px]">
            <CheckCircle className={cn('h-3.5 w-3.5', s.status === 'online' ? 'text-success' : 'text-destructive')} />
            <span className="flex-1 text-foreground">{s.name}</span>
            <span className="text-xs font-semibold text-muted-foreground">
              {s.latency !== undefined ? `${s.latency}ms` : s.status === 'online' ? 'Active' : 'Down'}
            </span>
          </div>
        ))}

        <div className="h-px bg-border/50 my-2" />

        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="w-8 font-semibold text-muted-foreground text-xs">CPU</span>
            <Progress value={status.cpu} className="flex-1 h-1.5 bg-muted" indicatorClassName="bg-info" />
            <span className="w-9 text-right text-xs font-semibold text-foreground">{status.cpu}%</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="w-8 font-semibold text-muted-foreground text-xs">RAM</span>
            <Progress value={status.ram} className="flex-1 h-1.5 bg-muted" indicatorClassName="bg-success" />
            <span className="w-9 text-right text-xs font-semibold text-foreground">{status.ram}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
