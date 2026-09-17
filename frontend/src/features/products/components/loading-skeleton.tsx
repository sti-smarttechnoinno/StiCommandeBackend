'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
        <CardHeader className="border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-32 h-8 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 py-3.5 border-b border-border/30">
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/20 last:border-0">
                <Skeleton className="w-4 h-4 rounded" />
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-3.5 w-36 mb-1.5" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-18" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-border/30">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-48" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
