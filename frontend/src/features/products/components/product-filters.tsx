'use client';

import React from 'react';
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
import { cn } from '@/lib/utils';
import { useProductsStore } from '../store';
import { Search, X, ChevronDown, LayoutGrid, List } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'mobile_credit', label: 'Mobile Credit' },
  { value: 'sim_cards', label: 'SIM Cards' },
  { value: 'scratch_cards', label: 'Scratch Cards' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'data_packs', label: 'Data Packs' },
  { value: 'voice_packages', label: 'Voice Packages' },
  { value: 'sms_packages', label: 'SMS Packages' },
];

const OPERATOR_OPTIONS = [
  { value: 'Mobilis', label: 'Mobilis' },
  { value: 'Ooredoo', label: 'Ooredoo' },
  { value: 'Djezzy', label: 'Djezzy' },
];

const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
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
          <ChevronDown className="h-3 w-3" />
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

export function ProductFilters() {
  const { filters, setFilter, resetFilters, viewMode, setViewMode } = useProductsStore();

  const activeFilterCount =
    filters.category.length +
    filters.operator.length +
    filters.productStatus.length +
    filters.region.length +
    (filters.stockStatus !== 'all' ? 1 : 0) +
    (filters.dateRange.start ? 1 : 0);

  const toggleArrayFilter = (key: 'category' | 'operator' | 'productStatus' | 'region', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  const isStockActive = filters.stockStatus !== 'all';
  const currentStockLabel = STOCK_OPTIONS.find((s) => s.value === filters.stockStatus)?.label || 'Stock Status';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search product name, SKU, operator..."
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

        {/* Category Filter */}
        <FilterDropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          selected={filters.category}
          onToggle={(v) => toggleArrayFilter('category', v)}
          onClear={() => setFilter('category', [])}
        />

        {/* Operator Filter */}
        <FilterDropdown
          label="Operator"
          options={OPERATOR_OPTIONS}
          selected={filters.operator}
          onToggle={(v) => toggleArrayFilter('operator', v)}
          onClear={() => setFilter('operator', [])}
        />

        {/* Stock Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isStockActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isStockActive ? currentStockLabel : 'Stock Status'}</span>
              {isStockActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Stock Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isStockActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setFilter('stockStatus', 'all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {STOCK_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.stockStatus === opt.value}
                  onCheckedChange={() => setFilter('stockStatus', opt.value as any)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Product Status Filter */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.productStatus}
          onToggle={(v) => toggleArrayFilter('productStatus', v)}
          onClear={() => setFilter('productStatus', [])}
        />

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={resetFilters}
          >
            <X className="h-3 w-3" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Right-side View Toggle */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex items-center bg-muted/60 rounded-full p-0.5 border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-full',
                viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-full',
                viewMode === 'grid' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
