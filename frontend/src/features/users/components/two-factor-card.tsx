'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, ShieldCheck } from 'lucide-react';

export function TwoFactorCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">Enabled</span>
            </div>
            <span className="text-lg font-bold text-foreground">72</span>
          </div>
          <Progress value={86} className="h-2 rounded-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Disabled</span>
            </div>
            <span className="text-lg font-bold text-foreground">12</span>
          </div>
          <Progress value={14} className="h-2 rounded-full" />
        </div>
        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] font-semibold text-primary leading-relaxed">
            <ShieldCheck className="h-3 w-3 inline mr-1" />
            Recommendation: Enable 2FA for all administrators and managers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
