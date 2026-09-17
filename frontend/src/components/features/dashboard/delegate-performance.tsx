'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { reportsService, type TopDelegateData } from '@/services/reports';
import { Award, MapPin, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

const RANK_BADGES = [
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-slate-400/15 text-slate-600 dark:text-slate-300',
  'bg-amber-700/15 text-amber-700 dark:text-amber-500',
  'bg-muted text-muted-foreground',
  'bg-muted text-muted-foreground',
];

const AVATAR_COLORS = [
  'bg-blue-500/10 text-blue-600',
  'bg-emerald-500/10 text-emerald-600',
  'bg-purple-500/10 text-purple-600',
  'bg-amber-500/10 text-amber-600',
  'bg-indigo-500/10 text-indigo-600',
];

export function DelegatePerformance() {
  const [delegates, setDelegates] = useState<TopDelegateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getTopDelegates()
      .then((res) => {
        if (isMounted) {
          setDelegates(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-start h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Award className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Delegate Performance</CardTitle>
              {delegates.length > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5">
                  Top {delegates.length}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Rankings and completion metrics for active sales reps
            </CardDescription>
          </div>
        </div>

        <Link href="/delegates">
          <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-start space-y-1">
        {loading ? (
          <div className="space-y-2 p-2 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : delegates.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 flex-1 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground shadow-2xs">
              <Users className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">No Delegate Performance Data</p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Delegate rankings and achievement metrics will appear here once delegates are assigned and process orders.
              </p>
            </div>
            <Link href="/delegates/new">
              <Button variant="outline" size="sm" className="text-xs mt-1 rounded-xl">
                Add Delegate
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Table Column Header for Grid Alignment */}
            <div className="grid grid-cols-12 items-center gap-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 rounded-lg mb-1">
              <div className="col-span-6 sm:col-span-4 md:col-span-4">Delegate</div>
              <div className="hidden sm:block col-span-2 text-center">Orders</div>
              <div className="hidden sm:block col-span-2 text-center">Revenue</div>
              <div className="hidden md:block col-span-2 text-center">Rate / Target</div>
              <div className="col-span-6 sm:col-span-4 md:col-span-2 text-right">Status</div>
            </div>

            {/* Delegate List Rows in Pixel-Perfect Grid Columns */}
            {delegates.map((d, i) => (
              <div
                key={d.id}
                className="group grid grid-cols-12 items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
              >
                {/* Column 1: Rank, Avatar, Name & Region */}
                <div className="col-span-6 sm:col-span-4 md:col-span-4 flex items-center gap-3 min-w-0">
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0', RANK_BADGES[i])}>
                    #{i + 1}
                  </span>

                  <div className="relative flex-shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn('text-xs font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                        {d.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-background bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {d.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-muted-foreground/70" />
                      {d.region}
                    </span>
                  </div>
                </div>

                {/* Column 2: Orders */}
                <div className="hidden sm:block col-span-2 text-center text-xs">
                  <span className="font-bold text-foreground">{d.orders}</span>
                </div>

                {/* Column 3: Revenue */}
                <div className="hidden sm:block col-span-2 text-center text-xs">
                  <span className="font-bold text-foreground">{(d.sales / 1000).toFixed(0)}K DA</span>
                </div>

                {/* Column 4: Rate & Progress Bar */}
                <div className="hidden md:block col-span-2 text-center px-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                    <span>{d.targetAchievement}%</span>
                  </div>
                  <Progress
                    value={d.targetAchievement}
                    className="h-1.5 bg-muted rounded-full"
                  />
                </div>

                {/* Column 5: Status */}
                <div className="col-span-6 sm:col-span-4 md:col-span-2 flex justify-end">
                  <Badge
                    variant="ghost"
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
