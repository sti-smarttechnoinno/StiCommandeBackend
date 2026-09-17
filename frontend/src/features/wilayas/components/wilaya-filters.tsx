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
import { useWilayasStore } from '../store';
import { Search, X, ChevronDown } from 'lucide-react';

const REGION_OPTIONS = [
  { value: 'east', label: 'East' },
  { value: 'center', label: 'Center' },
  { value: 'west', label: 'West' },
  { value: 'south', label: 'South' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'limited', label: 'Limited' },
  { value: 'inactive', label: 'Inactive' },
];

const REVENUE_OPTIONS = [
  { value: 'all', label: 'All Ranges' },
  { value: 'over_10m', label: 'Over 10M DA' },
  { value: '5m_10m', label: '5M - 10M DA' },
  { value: 'under_5m', label: 'Under 5M DA' },
];

const GROWTH_OPTIONS = [
  { value: 'all', label: 'All Growth' },
  { value: 'positive', label: 'Positive Growth' },
  { value: 'negative', label: 'Negative Growth' },
  { value: 'high', label: 'High Growth (15%+)' },
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

export function WilayaFilters() {
  const { filters, setFilter, resetFilters } = useWilayasStore();

  const isRevenueActive = filters.revenueRange !== 'all';
  const isGrowthActive = filters.growth !== 'all';

  const activeFilterCount =
    filters.region.length +
    filters.status.length +
    (isRevenueActive ? 1 : 0) +
    (isGrowthActive ? 1 : 0);

  const toggleArrayFilter = (key: 'region' | 'status', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  const currentRevenueLabel = REVENUE_OPTIONS.find((r) => r.value === filters.revenueRange)?.label || 'Revenue';
  const currentGrowthLabel = GROWTH_OPTIONS.find((g) => g.value === filters.growth)?.label || 'Growth';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search wilaya, delegate, or region..."
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

        {/* Region Filter */}
        <FilterDropdown
          label="Region"
          options={REGION_OPTIONS}
          selected={filters.region}
          onToggle={(v) => toggleArrayFilter('region', v)}
          onClear={() => setFilter('region', [])}
        />

        {/* Revenue Range Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isRevenueActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isRevenueActive ? currentRevenueLabel : 'Revenue'}</span>
              {isRevenueActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Revenue Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isRevenueActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setFilter('revenueRange', 'all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {REVENUE_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.revenueRange === opt.value}
                  onCheckedChange={() => setFilter('revenueRange', opt.value)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Growth Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isGrowthActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isGrowthActive ? currentGrowthLabel : 'Growth'}</span>
              {isGrowthActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Growth</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isGrowthActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setFilter('growth', 'all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {GROWTH_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.growth === opt.value}
                  onCheckedChange={() => setFilter('growth', opt.value)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onToggle={(v) => toggleArrayFilter('status', v)}
          onClear={() => setFilter('status', [])}
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
      </div>
    </div>
  );
}
