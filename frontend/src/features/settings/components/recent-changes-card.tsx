'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOCK_RECENT_CHANGES } from '../mock-data';
import { History, Shield, Database, Code, Building2, Bell, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  security: <Shield className="h-3 w-3 text-rose-500" />,
  backup: <Database className="h-3 w-3 text-emerald-500" />,
  api: <Code className="h-3 w-3 text-blue-500" />,
  company: <Building2 className="h-3 w-3 text-amber-500" />,
  notifications: <Bell className="h-3 w-3 text-purple-500" />,
};

export function RecentChangesCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Recent Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        <div className="space-y-3">
          {MOCK_RECENT_CHANGES.slice(0, 4).map((change) => (
            <div key={change.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/20 transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                {CATEGORY_ICONS[change.category] || <History className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground block truncate">
                  <span className="font-semibold">{change.user}</span> {change.action}
                </span>
                <span className="text-[10px] text-muted-foreground">{change.timestamp}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3 h-8 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl" onClick={() => toast.info('Viewing all changes')}>
          View All Changes
        </Button>
      </CardContent>
    </Card>
  );
}
