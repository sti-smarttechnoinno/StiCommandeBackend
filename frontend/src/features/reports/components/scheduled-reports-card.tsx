'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MOCK_SCHEDULED_REPORTS } from '../mock-data';
import { getStatusColor, getStatusDot } from '../utils';
import { CalendarClock, CheckCircle2, Pause } from 'lucide-react';

export function ScheduledReportsCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Scheduled Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-3">
          {MOCK_SCHEDULED_REPORTS.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {report.status === 'active' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Pause className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground truncate">{report.title}</span>
                  <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', getStatusColor(report.status))}>
                    <span className={cn('w-1 h-1 rounded-full inline-block mr-1', getStatusDot(report.status))} />
                    {report.status === 'active' ? 'Active' : 'Paused'}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{report.schedule}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
