'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function RegionsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-[140px] rounded-xl" />
            <Skeleton className="h-10 w-[130px] rounded-xl" />
            <Skeleton className="w-px h-6" />
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Region Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border border-border/40 shadow-xs rounded-[24px] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="hidden md:flex items-center gap-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-3 w-14 mx-auto mb-1" />
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
