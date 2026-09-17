'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_STORAGE } from '../mock-data';
import { HardDrive } from 'lucide-react';
import { toast } from 'sonner';

export function StorageUsageCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
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
        <Button variant="ghost" size="sm" className="w-full mt-4 h-8 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl" onClick={() => toast.info('Opening storage details')}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
