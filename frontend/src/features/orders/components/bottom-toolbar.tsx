'use client';

import { Button } from '@/components/ui/button';
import { useOrdersStore } from '../store';
import { Download, Printer, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function BottomToolbar() {
  const { selectedIds } = useOrdersStore();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-card border border-border/40 shadow-xs rounded-2xl">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70" onClick={() => toast.info('Exporting all orders...')}>
          <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export All
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70" onClick={() => toast.info('Generating report...')}>
          <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Generate Report
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70" onClick={() => toast.info('Printing summary...')}>
          <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Summary
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        {selectedIds.size > 0 && (
          <span className="text-[11px] font-medium text-primary mr-2">{selectedIds.size} selected</span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/40 hover:bg-muted/70" title="Table settings">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
