'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Monitor, Smartphone } from 'lucide-react';

export function OnlineUsersCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Online Users
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-foreground">Desktop</span>
                <span className="block text-[10px] text-muted-foreground">Windows / macOS</span>
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">18</span>
          </div>
          <Progress value={75} className="h-2 rounded-full" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-foreground">Mobile</span>
                <span className="block text-[10px] text-muted-foreground">Android / iOS</span>
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">6</span>
          </div>
          <Progress value={25} className="h-2 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
