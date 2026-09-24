'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsService, type BestProductData } from '@/services/reports';
import { useReportsStore } from '../store';
import { formatCurrency } from '../utils';
import { Crown, TrendingUp } from 'lucide-react';

export function BestProductsCard() {
  const refreshKey = useReportsStore((s) => s.refreshKey);
  const [products, setProducts] = useState<BestProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getBestProducts()
      .then((res) => {
        if (isMounted) {
          setProducts(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const maxSales = Math.max(...products.map((p) => p.sales), 1);

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card h-full flex flex-col justify-start">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Best Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3.5 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading top products...</div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Aucun produit vendu pour le moment</div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((product, i) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="w-5 text-[10px] font-bold text-muted-foreground text-center flex-shrink-0">
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-semibold text-foreground truncate">{product.name}</span>
                      {product.reference && (
                        <span className="font-mono text-[8px] font-medium text-muted-foreground bg-muted px-1 py-0.2 rounded border border-border/50">
                          {product.reference}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-foreground ml-2 shrink-0">{formatCurrency(product.sales)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {product.category}
                    </span>
                    {product.operator && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {product.operator}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{product.units.toLocaleString()} units</span>
                    <span className="text-[10px] font-semibold text-emerald-600 ml-auto flex items-center gap-0.5">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {product.growth}
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${(product.sales / maxSales) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
