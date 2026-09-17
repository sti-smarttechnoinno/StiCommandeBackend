import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ClientsLoading() {
  return (
    <div className="space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>

      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-7" />
              </div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-72 rounded-[12px]" />
            <Skeleton className="h-9 w-20 rounded-[12px]" />
            <Skeleton className="h-9 w-20 rounded-[12px]" />
            <Skeleton className="h-9 w-20 rounded-[12px]" />
            <Skeleton className="h-9 w-24 rounded-[12px]" />
            <Skeleton className="h-9 w-20 rounded-[12px]" />
          </div>
        </CardContent>
      </Card>

      {/* Table + Sidebar Skeleton */}
      <div className="flex gap-6">
        <Card className="flex-1 border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-48 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 py-3 bg-muted/30">
              <div className="grid grid-cols-13 gap-4">
                {Array.from({ length: 13 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-5 py-4 border-b border-border/30">
                <div className="grid grid-cols-13 gap-4 items-center">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar Skeleton */}
        <div className="w-[360px] flex-shrink-0 space-y-4 hidden xl:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border/40 shadow-xs rounded-[20px] overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3">
                  {Array.from({ length: i === 0 ? 6 : 4 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
