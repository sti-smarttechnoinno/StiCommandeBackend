'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MOCK_STORAGE } from '../mock-data';
import { Database, Download, Upload, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function BackupSettings() {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Backup & Restore
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-muted/30">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Last Backup</span>
            <span className="text-xs font-bold text-foreground">2 hours ago</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Next Backup</span>
            <span className="text-xs font-bold text-foreground">In 4 hours</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Backup Size</span>
            <span className="text-xs font-bold text-foreground">2.4 GB</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Frequency</span>
            <span className="text-xs font-bold text-foreground">Every 6 hours</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Storage Usage</h4>
          <div className="space-y-3">
            {MOCK_STORAGE.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="font-bold text-foreground">{item.used}%</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${item.used}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.success('Backup created')}>
            <Database className="h-3.5 w-3.5 mr-1.5" /> Create
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.success('Downloading backup')}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.info('Restore initiated')}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore
          </Button>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-xs font-semibold" onClick={() => toast.info('Schedule configured')}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
