'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatCurrency, formatFullCurrency, formatFullDate, getStockBarColor } from '../utils';
import { ProductStatusBadge, CategoryBadge, OperatorBadge } from './product-badges';
import { productsService, type ProductData } from '@/services/products';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { X, Package, Tag, DollarSign, BarChart3, ShoppingCart, Pencil, ArrowRightLeft, DollarSign as DollarIcon, Ban, Loader2 } from 'lucide-react';

interface ProductDetailsDrawerProps {
  productId: string | null;
  onClose: () => void;
}

export function ProductDetailsDrawer({ productId, onClose }: ProductDetailsDrawerProps) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    setLoading(true);
    productsService
      .get(productId)
      .then((data) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (!productId) return null;

  const stock = product?.stockQuantity ?? product?.stock ?? 0;
  const minStock = product?.minStock ?? 100;
  const stockPercent = minStock > 0 ? Math.min((stock / (minStock * 10)) * 100, 100) : 100;
  const available = stock - (product?.reserved ?? 0);

  return (
    <Drawer open={!!productId} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-[450px] max-w-[450px]">
        {loading || !product ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading product details...</span>
          </div>
        ) : (
          <>
            <DrawerHeader className="border-b border-border/40 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 rounded-2xl bg-primary/10">
                    <AvatarFallback className="text-primary text-lg font-bold rounded-2xl">
                      <Package className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DrawerTitle className="text-lg font-bold text-foreground">{product.name}</DrawerTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <OperatorBadge operator={product.operator} />
                      <CategoryBadge category={product.category} />
                    </div>
                  </div>
                </div>
                <DrawerClose className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Product Status */}
              <div className="flex items-center gap-3">
                <ProductStatusBadge product={product as any} />
                <span className="text-xs text-muted-foreground">SKU: {product.sku || product.code}</span>
                {product.barcode && <span className="text-xs text-muted-foreground">Barcode: {product.barcode}</span>}
              </div>

              {/* Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Category</span>
                    <span className="text-sm font-semibold text-foreground capitalize">{product.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Operator</span>
                    <span className="text-sm font-semibold text-foreground">{product.operator}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Warehouse</span>
                    <span className="text-sm font-semibold text-foreground">{product.warehouse || 'Main Warehouse'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">Created</span>
                    <span className="text-sm font-semibold text-foreground">{formatFullDate(product.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Matrix (Nominal Price, Discount %, Selling Price) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pricing Matrix</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-base font-bold text-foreground block">
                        {formatCurrency(product.nominalPrice || product.price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">Nominal Price</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <Tag className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400 block">
                        {product.discountPercent}%
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">Discount</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-3 text-center">
                      <DollarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 uppercase font-semibold">
                        Selling Price
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Inventory */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Inventory</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Current Stock</span>
                    <span className="text-sm font-bold text-foreground">{stock.toLocaleString()} units</span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                        getStockBarColor(stock, minStock)
                      )}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 rounded-lg bg-muted/30 text-center">
                      <span className="text-[10px] text-muted-foreground block">Reserved</span>
                      <span className="text-sm font-semibold text-foreground">{product.reserved || 0}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 text-center">
                      <span className="text-[10px] text-muted-foreground block">Available</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{available}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 text-center">
                      <span className="text-[10px] text-muted-foreground block">Min Stock</span>
                      <span className="text-sm font-semibold text-foreground">{minStock}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sales</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground block">{(product.totalSold || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Units Sold</span>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/40 shadow-xs rounded-xl">
                    <CardContent className="p-3 text-center">
                      <BarChart3 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <span className="text-lg font-bold text-foreground block">{formatFullCurrency(product.revenue || 0)}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Revenue</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border/40 p-4 flex items-center gap-2">
              <Button className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Pencil className="h-3.5 w-3.5" /> Edit Product
              </Button>
              <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold gap-1.5 border-border/60">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Adjust Stock
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
