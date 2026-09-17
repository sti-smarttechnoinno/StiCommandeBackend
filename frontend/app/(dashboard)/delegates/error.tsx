'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DelegatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Delegates page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Failed to load delegates data. Please try again.
          </p>
          {error.message && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-6 font-mono">
              {error.message}
            </p>
          )}
          <Button
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
