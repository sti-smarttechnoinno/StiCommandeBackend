'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_SYSTEM_INFO } from '../mock-data';
import { Info, Server, CheckCircle2 } from 'lucide-react';

export function AboutSystem() {
  const info = [
    { label: 'Version', value: MOCK_SYSTEM_INFO.version },
    { label: 'Build', value: MOCK_SYSTEM_INFO.build },
    { label: 'Environment', value: MOCK_SYSTEM_INFO.environment },
    { label: 'Framework', value: MOCK_SYSTEM_INFO.framework },
    { label: 'Database', value: MOCK_SYSTEM_INFO.database },
    { label: 'Runtime', value: MOCK_SYSTEM_INFO.runtime },
    { label: 'License', value: MOCK_SYSTEM_INFO.license },
  ];

  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          About System
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">STI ERP</h3>
            <p className="text-xs text-muted-foreground">Enterprise Resource Planning System</p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {MOCK_SYSTEM_INFO.serverStatus}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {info.map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-muted/30">
              <span className="text-[10px] text-muted-foreground block mb-0.5">{item.label}</span>
              <span className="text-xs font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
