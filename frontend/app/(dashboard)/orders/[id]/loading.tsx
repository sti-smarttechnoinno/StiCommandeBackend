import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function OrderDetailLoading() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-muted/60 rounded-md animate-pulse" />
          <div className="h-8 w-64 bg-muted/80 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted/50 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted/60 rounded-full animate-pulse" />
          <div className="h-9 w-28 bg-muted/60 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <Card className="border border-border/50 rounded-2xl p-6 bg-card">
        <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/70 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted/70 rounded-md animate-pulse" />
              <div className="h-4 w-32 bg-muted/50 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="h-14 w-48 bg-muted/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>

      {/* 4 KPIs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-border/40 rounded-2xl p-5 bg-card">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted/60 rounded-md animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-muted/70 animate-pulse" />
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-7 w-28 bg-muted/80 rounded-md animate-pulse" />
              <div className="h-3.5 w-36 bg-muted/50 rounded-md animate-pulse" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border/40 rounded-2xl h-96 bg-card p-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Chargement des détails de la commande...</p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border border-border/40 rounded-2xl h-48 bg-card" />
          <Card className="border border-border/40 rounded-2xl h-48 bg-card" />
        </div>
      </div>
    </div>
  );
}
