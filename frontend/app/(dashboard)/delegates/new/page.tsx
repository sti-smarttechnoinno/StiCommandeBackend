'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Calendar, UserPlus } from 'lucide-react';
import { CreateDelegateForm } from '@/features/delegates/components/create-delegate-form';

export default function NewDelegatePage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Breadcrumb & Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/delegates" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Delegates
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/delegates/new" className="text-foreground text-xs font-semibold capitalize">
                  New Delegate
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Add New Delegate
              </h1>
              <p className="text-sm text-muted-foreground">
                Onboard new field sales delegate into STI distribution network.
              </p>
            </div>
          </div>
        </div>

        {/* Date Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Main Form Component */}
      <CreateDelegateForm />
    </div>
  );
}
