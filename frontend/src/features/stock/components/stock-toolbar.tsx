'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStockStore } from '../store';
import { stockService } from '@/services/stock';
import { warehousesService } from '@/services/warehouses';
import { Search, X, ChevronDown, Calendar, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onToggle, onClear }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none" nativeButton={false}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
            selected.length > 0
              ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {selected.length > 0 && (
            <>
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={onClear}
                className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                onSelect={(e) => e.preventDefault()}
              >
                Clear all
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onToggle(opt.value)}
              className="rounded-lg cursor-pointer text-xs"
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StockToolbar() {
  const { filters, setFilter, resetFilters, triggerRefresh } = useStockStore();
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string }[]>([]);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      stockService.getFilterOptions(),
      warehousesService.list({ active_only: true }).catch(() => null),
    ])
      .then(([opts, whRes]) => {
        const dbNames = whRes?.data?.map((w) => w.name) || [];
        const combined = Array.from(new Set([...dbNames, ...(opts.warehouses || [])]));
        if (combined.length) {
          setWarehouseOptions(combined.map((w) => ({ value: w, label: w })));
        }
      })
      .catch(() => {});
  }, []);

  const activeFilterCount =
    filters.warehouse.length +
    filters.movementType.length +
    filters.delegate.length +
    filters.status.length +
    (filters.dateRange.start ? 1 : 0);

  const toggleArrayFilter = (key: 'warehouse' | 'movementType' | 'delegate' | 'status', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  const handleExport = async () => {
    try {
      toast.info('Exporting stock movements...');
      const res = await stockService.list({ pageSize: 1000 });
      if (!res.data.length) {
        toast.error('No movements to export');
        return;
      }
      const headers = ['Reference', 'Product', 'Type', 'Quantity', 'Warehouse', 'Destination', 'Delegate', 'Status', 'Date'];
      const csvRows = [headers.join(',')];
      for (const m of res.data) {
        csvRows.push([
          `"${m.reference}"`,
          `"${m.product}"`,
          `"${m.movementType}"`,
          m.quantity,
          `"${m.warehouse}"`,
          `"${m.destinationWarehouse || ''}"`,
          `"${m.delegate || ''}"`,
          `"${m.status}"`,
          `"${m.date}"`,
        ].join(','));
      }
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Stock movements exported successfully');
    } catch {
      toast.error('Failed to export movements');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search product, reference, delegate..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Warehouse Filter */}
        <FilterDropdown
          label="Warehouse"
          options={warehouseOptions}
          selected={filters.warehouse}
          onToggle={(v) => toggleArrayFilter('warehouse', v)}
          onClear={() => setFilter('warehouse', [])}
        />

        {/* Movement Type Filter */}
        <FilterDropdown
          label="Type"
          options={TYPE_OPTIONS}
          selected={filters.movementType}
          onToggle={(v) => toggleArrayFilter('movementType', v)}
          onClear={() => setFilter('movementType', [])}
        />

        {/* Status Filter */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onToggle={(v) => toggleArrayFilter('status', v)}
          onClear={() => setFilter('status', [])}
        />

        {/* Date Range Popover */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                filters.dateRange.start
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>Date Range</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 rounded-xl p-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">From</label>
                  <Input
                    type="date"
                    value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setFilter('dateRange', {
                        ...filters.dateRange,
                        start: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">To</label>
                  <Input
                    type="date"
                    value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setFilter('dateRange', {
                        ...filters.dateRange,
                        end: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setFilter('dateRange', { start: null, end: null });
                    setDateOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={resetFilters}
          >
            <X className="h-3 w-3" />
            <span>Clear ({activeFilterCount})</span>
          </Button>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1.5"
            onClick={() => {
              triggerRefresh();
              toast.success('Stock data refreshed');
            }}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1.5"
            onClick={handleExport}
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
