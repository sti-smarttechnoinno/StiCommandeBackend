import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Search, Plus, MapPin } from 'lucide-react';
import { useRegionsStore } from '../store';

export function RegionsEmptyState({ onCreateRegion }: { onCreateRegion?: () => void }) {
  const { resetFilters } = useRegionsStore();

  return (
    <Card className="border border-border/40 shadow-xs rounded-[24px] overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Globe className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No Regions Found</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Try another search or create a new region.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs font-semibold gap-1.5"
            onClick={resetFilters}
          >
            <Search className="h-3.5 w-3.5" /> Clear Filters
          </Button>
          {onCreateRegion && (
            <Button
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-1.5"
              onClick={onCreateRegion}
            >
              <Plus className="h-3.5 w-3.5" /> Add Region
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RegionsErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[24px] overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-destructive/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">Failed to load regions</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          An error occurred while loading region data. Please try again.
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
