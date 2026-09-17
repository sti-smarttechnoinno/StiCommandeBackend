'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';

export function WilayasEmptyState() {
  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No Wilayas Found</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Try changing the filters or import performance data.
        </p>
        <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
          <Search className="h-3.5 w-3.5" /> Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}

export function WilayasErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-destructive/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">Failed to load wilayas</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          An error occurred while loading wilaya data. Please try again.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
