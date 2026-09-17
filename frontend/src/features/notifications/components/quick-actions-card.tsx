'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Megaphone,
  Bell,
  Mail,
  MessageSquare,
  FileText,
  Radio,
  Shield,
  Settings,
  ChevronRight,
} from 'lucide-react';

const ACTIONS = [
  { icon: <Megaphone className="h-4 w-4" />, label: 'Create Announcement', color: 'text-rose-600 bg-rose-500/10 hover:bg-rose-500/20' },
  { icon: <Bell className="h-4 w-4" />, label: 'Send Push', color: 'text-blue-600 bg-blue-500/10 hover:bg-blue-500/20' },
  { icon: <Mail className="h-4 w-4" />, label: 'Email Notify', color: 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { icon: <MessageSquare className="h-4 w-4" />, label: 'SMS Alert', color: 'text-amber-600 bg-amber-500/10 hover:bg-amber-500/20' },
  { icon: <FileText className="h-4 w-4" />, label: 'Templates', color: 'text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20' },
  { icon: <Radio className="h-4 w-4" />, label: 'Channels', color: 'text-cyan-600 bg-cyan-500/10 hover:bg-cyan-500/20' },
  { icon: <Shield className="h-4 w-4" />, label: 'Permissions', color: 'text-purple-600 bg-purple-500/10 hover:bg-purple-500/20' },
  { icon: <Settings className="h-4 w-4" />, label: 'Settings', color: 'text-muted-foreground bg-muted hover:bg-muted/80' },
];

export function QuickActionsCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className="h-auto p-3 rounded-xl justify-start gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              onClick={() => toast.success(`${action.label} opened`)}
            >
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', action.color)}>
                {action.icon}
              </span>
              <span className="text-[11px] font-semibold text-foreground text-left flex-1">{action.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
