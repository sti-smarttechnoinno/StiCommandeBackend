'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_PASSWORD_EXPIRY } from '../mock-data';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function PasswordExpiryCard() {
  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Password Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-3">
          {MOCK_PASSWORD_EXPIRY.map((user) => (
            <div key={user.name} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:bg-muted/20 transition-colors">
              <span className="text-xs font-semibold text-foreground">{user.name}</span>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                user.daysLeft <= 7 ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
              )}>
                {user.daysLeft} days
              </span>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-4 h-8 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl" onClick={() => toast.info('Viewing all expiring passwords')}>
          View All
        </Button>
      </CardContent>
    </Card>
  );
}
