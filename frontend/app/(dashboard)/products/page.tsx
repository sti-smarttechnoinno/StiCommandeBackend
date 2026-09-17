'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useProductsStore } from '@/features/products/store';
import { KPICards as ProductKpiCards } from '@/features/products/components/kpi-cards';
import { ProductsTable } from '@/features/products/components/products-table';
import { AnalyticsPanel } from '@/features/products/components/analytics-panel';
import { ProductDetailsDrawer } from '@/features/products/components/product-details-drawer';
import { ProductsLoadingSkeleton } from '@/features/products/components/loading-skeleton';
import { ProductsErrorState } from '@/features/products/components/error-states';
import { Plus, Download, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

export default function ProductsPage() {
  const { can } = usePermissions();
  const { selectedProduct, setSelectedProduct } = useProductsStore();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
      setIsRefreshing(false);
      toast.success('Products refreshed');
    }, 800);
  }, []);

  const handleViewProduct = useCallback(
    (id: string) => {
      setSelectedProduct(id);
    },
    [setSelectedProduct]
  );

  if (!mounted) return null;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Products Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage product inventory, pricing, and catalog</p>
          </div>
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
        <ProductsErrorState onRetry={handleRefresh} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Products Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage product inventory, pricing, and catalog</p>
          </div>
        </div>
        <ProductsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header / Hero inside Products Page */}
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
                  products
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Products Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage product inventory, pricing, stock levels, and telecom catalog.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{currentDate}</span>
          </div>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Exporting catalog...')}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          {/* New Product Primary Button (Visible only if can('products.manage')) */}
          {can('products.manage') && (
            <Link href="/products/new">
              <Button
                size="sm"
                className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                <span>New Product</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <ProductKpiCards />

      {/* Full Width Combined Filter & Table Component */}
      <div className="w-full">
        <ProductsTable onViewProduct={handleViewProduct} />
      </div>

      {/* Bottom Section: Inventory & Sales Summary (3 Column Grid Full Width) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Inventory & Catalog Summary</h2>
        <AnalyticsPanel />
      </div>

      {/* Product Details Drawer */}
      {selectedProduct && (
        <ProductDetailsDrawer productId={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
