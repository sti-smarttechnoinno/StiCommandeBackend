'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MOCK_INTEGRATIONS } from '../mock-data';
import { Plug, CheckCircle2, XCircle, AlertTriangle, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  connected: { color: 'bg-emerald-500/10 text-emerald-600', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Connected' },
  disconnected: { color: 'bg-muted text-muted-foreground', icon: <XCircle className="h-3 w-3" />, label: 'Disconnected' },
  error: { color: 'bg-rose-500/10 text-rose-600', icon: <AlertTriangle className="h-3 w-3" />, label: 'Error' },
};

export function IntegrationsGrid() {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Plug className="h-4 w-4 text-primary" />
          Integrations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MOCK_INTEGRATIONS.map((intg) => {
            const cfg = STATUS_CONFIG[intg.status];
            return (
              <div key={intg.id} className="p-4 rounded-xl border border-border/30 hover:bg-muted/20 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{intg.name}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border-0', cfg.color)}>
                    {cfg.icon} {cfg.label}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{intg.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Sync: {intg.lastSync}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2 rounded-md text-[10px] font-semibold" onClick={() => toast.success(`${intg.name} configured`)}>
                      <Settings className="h-3 w-3 mr-1" /> Config
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 rounded-md text-[10px] font-semibold" onClick={() => toast.success(`Testing ${intg.name}`)}>
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
