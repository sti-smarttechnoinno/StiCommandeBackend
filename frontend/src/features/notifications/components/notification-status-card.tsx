'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_DISTRIBUTION } from '../mock-data';
import { BarChart3 } from 'lucide-react';

const MAX = Math.max(...STATUS_DISTRIBUTION.map((s) => s.value));

export function NotificationStatusCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Notification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-3">
          {STATUS_DISTRIBUTION.map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value.toLocaleString()}</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${(item.value / MAX) * 100}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
