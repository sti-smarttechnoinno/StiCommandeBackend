import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-7" />
              </div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-28 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 border border-border/40 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="xl:col-span-1 border border-border/40 shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border border-border/40 shadow-xs rounded-2xl overflow-hidden p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
