'use client';

import { Button } from '@/components/ui/button';
import { useClientsStore } from '../store';
import { Download, Printer, FileText, Settings, Coins, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { ImportRecouvrementDialog } from './import-recouvrement-dialog';
import { ImportEncaissementsDialog } from './import-encaissements-dialog';

interface BottomToolbarProps {
  onSuccess?: () => void;
}

export function BottomToolbar({ onSuccess }: BottomToolbarProps = {}) {
  const { selectedIds } = useClientsStore();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-card border border-border/40 shadow-xs rounded-2xl">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70"
          onClick={() => toast.info('Exporting all clients...')}
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70"
          onClick={() => toast.info('Generating clients report...')}
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Generate Report
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70"
          onClick={() => toast.info('Printing summary...')}
        >
          <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Summary
        </Button>

        {/* Update Solde Recouvrement Action */}
        <ImportRecouvrementDialog
          onSuccess={onSuccess}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all shadow-2xs cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span>Mettre à jour les soldes</span>
            </Button>
          }
        />

        {/* Update Encaissements Action */}
        <ImportEncaissementsDialog
          onSuccess={onSuccess}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all shadow-2xs cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mettre à jour les encaissements</span>
            </Button>
          }
        />
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
