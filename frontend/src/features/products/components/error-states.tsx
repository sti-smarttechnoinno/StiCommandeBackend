'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export function ProductsEmptyState() {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">No products found</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          No products match your current filters. Try adjusting your search criteria or add a new product.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
            <Search className="h-3.5 w-3.5" /> Clear Filters
          </Button>
          <Button size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductsErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-destructive/50" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">Failed to load products</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          An error occurred while loading product data. Please try again.
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
