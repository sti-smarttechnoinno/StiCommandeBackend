'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProductsStore } from '../store';
import { filterProducts, sortProducts, formatCurrency, getStockBarColor, getMarginColor } from '../utils';
import { mockProducts } from '../mock-data';
import { ProductStatusBadge, CategoryBadge, OperatorBadge } from './product-badges';
import { Package, Eye, Pencil, ArrowRightLeft, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductsGridProps {
  onViewProduct: (id: string) => void;
}

export function ProductsGrid({ onViewProduct }: ProductsGridProps) {
  const { filters, sort } = useProductsStore();

  const products = useMemo(() => {
    const filtered = filterProducts(mockProducts, filters);
    return sortProducts(filtered, sort.field, sort.direction);
  }, [filters, sort]);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm font-semibold text-foreground mb-1">No products found</p>
        <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const stockPercent = product.minStock > 0
          ? Math.min((product.stock / (product.minStock * 10)) * 100, 100)
          : 100;
        return (
          <Card
            key={product.id}
            className="group border border-border/40 shadow-xs rounded-[20px] overflow-hidden hover:shadow-md hover:border-border/60 transition-all cursor-pointer"
            onClick={() => onViewProduct(product.id)}
          >
            {/* Product Image Placeholder */}
            <div className="relative h-40 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent flex items-center justify-center border-b border-border/30">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-7 w-7" />
              </div>
              <div className="absolute top-3 right-3">
                <ProductStatusBadge product={product} />
              </div>
              <div className="absolute top-3 left-3">
                <OperatorBadge operator={product.operator} />
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Name & SKU */}
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{product.sku}</p>
              </div>

              {/* Category */}
              <CategoryBadge category={product.category} />

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-[9px] text-muted-foreground block">Face Value</span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrency(product.faceValue)}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <span className="text-[9px] text-muted-foreground block">Selling</span>
                  <span className="text-xs font-semibold text-foreground">{formatCurrency(product.sellingPrice)}</span>
                </div>
              </div>

              {/* Margin */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Margin</span>
                <span className={cn('text-xs font-bold', getMarginColor(product.margin))}>{product.margin}%</span>
              </div>

              {/* Stock */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Stock</span>
                  <span className="text-xs font-bold text-foreground">{product.stock.toLocaleString()}</span>
                </div>
                <Progress
                  value={stockPercent}
                  className="h-1.5"
                  indicatorClassName={cn('transition-all duration-500', getStockBarColor(product.stock, product.minStock))}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1 text-xs font-medium gap-1"
                  onClick={(e) => { e.stopPropagation(); onViewProduct(product.id); }}
                >
                  <Eye className="h-3 w-3" /> View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1 text-xs font-medium gap-1"
                  onClick={(e) => { e.stopPropagation(); toast.info(`Edit ${product.name}`); }}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); toast.success(`${product.name} deleted`); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
