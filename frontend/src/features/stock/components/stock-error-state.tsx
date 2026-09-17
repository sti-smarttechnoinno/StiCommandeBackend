'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function StockErrorState() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="border border-border/40 shadow-xs rounded-2xl max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Failed to Load Stock Data</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unable to fetch stock operations. Please check your connection and try again.
          </p>
          <Button
            className="bg-[#D71920] hover:bg-[#B81419] text-white shadow-md shadow-[#D71920]/20 rounded-xl px-6 h-10 text-sm font-semibold"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
