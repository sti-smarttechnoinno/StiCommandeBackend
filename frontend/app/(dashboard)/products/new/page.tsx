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
import { Calendar, PackagePlus } from 'lucide-react';
import { CreateProductForm } from '@/features/products/components/create-product-form';

import { RoleGuard } from '@/components/auth/role-guard';

export default function NewProductPage() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  if (!mounted) return null;

  return (
    <RoleGuard requiredPermission="products.manage">
      <div className="space-y-8 pb-10">
        {/* Top Breadcrumb & Page Header */}
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
                  <BreadcrumbLink href="/products" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                    Products
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/products/new" className="text-foreground text-xs font-semibold capitalize">
                    New Product
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
                <PackagePlus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Add New Product
                </h1>
                <p className="text-sm text-muted-foreground">
                  Add a new telecom catalog item, set nominal price, discount rate, and initial stock.
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
        <CreateProductForm />
      </div>
    </RoleGuard>
  );
}
