'use client';

import { Button } from '@/components/ui/button';
import { useClientsStore } from '../store';
import { Download, UserPlus, UserCheck, UserX, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export function BulkActions() {
  const { selectedIds, clearSelection } = useClientsStore();

  if (selectedIds.size === 0) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-primary/10 rounded-t-[20px]">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-primary">{selectedIds.size} clients selected</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={clearSelection}
        >
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium gap-1.5" onClick={() => toast.info('Exporting...')}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium gap-1.5" onClick={() => toast.info('Assigning delegate...')}>
          <UserPlus className="h-3.5 w-3.5" /> Assign Delegate
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 text-emerald-600 hover:bg-emerald-500/10" onClick={() => toast.success('Clients activated')}>
          <UserCheck className="h-3.5 w-3.5" /> Activate
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 text-amber-600 hover:bg-amber-500/10" onClick={() => toast.warning('Clients deactivated')}>
          <UserX className="h-3.5 w-3.5" /> Deactivate
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => toast.success('Clients deleted')}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
