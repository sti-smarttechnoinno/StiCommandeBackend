'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStockStore } from '../store';
import { stockService } from '@/services/stock';
import { warehousesService } from '@/services/warehouses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDown, ArrowUp, RefreshCw, Sliders, Loader2, Package, Warehouse as WarehouseIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { MovementType } from '../types';

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'incoming', label: 'Incoming', icon: <ArrowDown className="h-4 w-4" />, color: 'text-emerald-600' },
  { value: 'outgoing', label: 'Outgoing', icon: <ArrowUp className="h-4 w-4" />, color: 'text-rose-600' },
  { value: 'transfer', label: 'Transfer', icon: <RefreshCw className="h-4 w-4" />, color: 'text-blue-600' },
  { value: 'adjustment', label: 'Adjustment', icon: <Sliders className="h-4 w-4" />, color: 'text-amber-600' },
];

export function StockMovementModal() {
  const { isMovementModalOpen, setMovementModalOpen, triggerRefresh } = useStockStore();
  const [movementType, setMovementType] = useState<MovementType>('incoming');
  const [warehouse, setWarehouse] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productsList, setProductsList] = useState<{ id: string; name: string; code: string; currentStock: number }[]>([]);
  const [warehousesList, setWarehousesList] = useState<string[]>([]);

  useEffect(() => {
    if (isMovementModalOpen) {
      Promise.all([
        stockService.getFilterOptions(),
        warehousesService.list({ active_only: true }).catch(() => null),
      ]).then(([opts, whRes]) => {
        if (opts.products?.length) {
          setProductsList(opts.products);
          if (!productId && opts.products[0]) {
            setProductId(opts.products[0].id);
          }
        }

        const dbWarehouses = whRes?.data || [];
        const dbNames = dbWarehouses.map((w) => w.name);
        const combined = Array.from(new Set([...dbNames, ...(opts.warehouses || [])]));

        if (combined.length) {
          setWarehousesList(combined);
          const defaultWh = dbWarehouses.find((w) => w.is_default);
          if (defaultWh) {
            setWarehouse(defaultWh.name);
          } else if (!warehouse && combined[0]) {
            setWarehouse(combined[0]);
          }
        }
      }).catch(() => {});
    }
  }, [isMovementModalOpen]);

  const handleSubmit = async () => {
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!warehouse) {
      toast.error('Please select a warehouse');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProd = productsList.find((p) => p.id === productId);
      await stockService.createMovement({
        product_id: productId,
        movement_type: movementType,
        quantity: qtyNum,
        warehouse,
        destination_warehouse: movementType === 'transfer' ? destinationWarehouse : undefined,
        notes: notes || undefined,
        status: 'completed',
      });

      toast.success('Stock movement recorded successfully', {
        description: `${movementType.toUpperCase()} of ${qtyNum} units (${selectedProd?.name || 'Product'}) in ${warehouse}`,
      });

      triggerRefresh();
      setMovementModalOpen(false);
      setQuantity('');
      setNotes('');
      setDestinationWarehouse('');
    } catch {
      toast.error('Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = productsList.find((p) => p.id === productId);

  return (
    <Dialog open={isMovementModalOpen} onOpenChange={setMovementModalOpen}>
      <DialogContent className="max-w-[680px] rounded-2xl p-0 overflow-hidden bg-card border border-border/70 shadow-xl">
        <DialogHeader className="px-7 pt-7 pb-2">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              New Stock Movement
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Record a stock operation and update live product inventory.
            </p>
          </div>
        </DialogHeader>

        <div className="px-7 py-5 space-y-5">
          {/* Movement Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Movement Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MOVEMENT_TYPES.map((type) => {
                const isSelected = movementType === type.value;
                return (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => setMovementType(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150 text-left',
                      isSelected
                        ? 'border-primary/60 bg-primary/10 shadow-2xs ring-1 ring-primary/20'
                        : 'border-border/70 bg-background hover:bg-muted/50 hover:border-border'
                    )}
                  >
                    <span className={cn(type.color)}>{type.icon}</span>
                    <span
                      className={cn(
                        'text-xs font-bold',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product & Warehouse Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Product <span className="text-destructive">*</span></span>
                {selectedProduct && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Available: <strong className="text-foreground">{selectedProduct.currentStock}</strong>
                  </span>
                )}
              </label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? '')}>
                <SelectTrigger className="w-full h-11 min-h-[44px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs px-3.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <SelectValue placeholder="Select product">
                      {selectedProduct ? selectedProduct.name : undefined}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="w-(--anchor-width) max-h-60 rounded-xl border-border/60 p-1 shadow-lg bg-popover"
                >
                  {productsList.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="text-xs font-semibold py-2.5 px-3 rounded-lg cursor-pointer hover:bg-muted/80"
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        <span className="font-semibold text-foreground truncate">{p.name}</span>
                        <span className="text-[10.5px] text-muted-foreground font-mono bg-muted/80 px-2 py-0.5 rounded shrink-0">
                          {p.currentStock.toLocaleString()} units
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warehouse Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Source Warehouse <span className="text-destructive">*</span>
              </label>
              <Select value={warehouse} onValueChange={(v) => setWarehouse(v ?? '')}>
                <SelectTrigger className="w-full h-11 min-h-[44px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs px-3.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <WarehouseIcon className="h-4 w-4 text-primary shrink-0" />
                    <SelectValue placeholder="Select warehouse">
                      {warehouse || undefined}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="w-(--anchor-width) max-h-60 rounded-xl border-border/60 p-1 shadow-lg bg-popover"
                >
                  {warehousesList.map((wh) => (
                    <SelectItem
                      key={wh}
                      value={wh}
                      className="text-xs font-semibold py-2.5 px-3 rounded-lg cursor-pointer hover:bg-muted/80"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground">{wh}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Destination Warehouse (if transfer) */}
          {movementType === 'transfer' && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-150">
              <label className="text-xs font-bold text-foreground">
                Destination Warehouse <span className="text-destructive">*</span>
              </label>
              <Select value={destinationWarehouse} onValueChange={(v) => setDestinationWarehouse(v ?? '')}>
                <SelectTrigger className="w-full h-11 min-h-[44px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs px-3.5">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <WarehouseIcon className="h-4 w-4 text-blue-500 shrink-0" />
                    <SelectValue placeholder="Select destination warehouse">
                      {destinationWarehouse || undefined}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="w-(--anchor-width) max-h-60 rounded-xl border-border/60 p-1 shadow-lg bg-popover"
                >
                  {warehousesList
                    .filter((wh) => wh !== warehouse)
                    .map((wh) => (
                      <SelectItem
                        key={wh}
                        value={wh}
                        className="text-xs font-semibold py-2.5 px-3 rounded-lg cursor-pointer hover:bg-muted/80"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-foreground">{wh}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Quantity (Units) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-11 min-h-[44px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus-visible:ring-primary/20 shadow-2xs px-3.5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Notes / Reference
              </label>
              <Input
                placeholder="e.g. Supplier delivery or shipment reference"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 min-h-[44px] text-sm font-medium text-foreground bg-background rounded-xl border-border/70 focus-visible:ring-primary/20 shadow-2xs px-3.5"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-7 py-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            className="h-10 px-4 rounded-xl text-xs font-semibold border-border/70 bg-card hover:bg-muted/80"
            onClick={() => setMovementModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="h-10 px-5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            onClick={handleSubmit}
            disabled={!movementType || !warehouse || !quantity || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Recording...
              </>
            ) : (
              'Confirm Movement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
