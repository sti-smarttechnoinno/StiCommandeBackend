'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Database, Trash2, FileText, Users, Key, Settings, ChevronRight } from 'lucide-react';

const ACTIONS = [
  { icon: <Database className="h-4 w-4" />, label: 'Create Backup', color: 'text-blue-600 bg-blue-500/10 hover:bg-blue-500/20' },
  { icon: <Trash2 className="h-4 w-4" />, label: 'Clear Cache', color: 'text-amber-600 bg-amber-500/10 hover:bg-amber-500/20' },
  { icon: <FileText className="h-4 w-4" />, label: 'System Logs', color: 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { icon: <Users className="h-4 w-4" />, label: 'Active Sessions', color: 'text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20' },
  { icon: <Key className="h-4 w-4" />, label: 'API Keys', color: 'text-purple-600 bg-purple-500/10 hover:bg-purple-500/20' },
  { icon: <Settings className="h-4 w-4" />, label: 'Maintenance', color: 'text-rose-600 bg-rose-500/10 hover:bg-rose-500/20' },
];

export function QuickActionsCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight">Quick System Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className="h-auto p-2.5 rounded-xl justify-start gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              onClick={() => toast.success(`${action.label} executed`)}
            >
              <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', action.color)}>
                {action.icon}
              </span>
              <span className="text-[11px] font-semibold text-foreground text-left flex-1 truncate">{action.label}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
