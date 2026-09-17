'use client';

import React, { useState, useEffect } from 'react';
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
import { useDelegatesStore } from '../store';
import { delegatesService } from '@/services/delegates';
import { regionsService } from '@/services/regions';
import { Search, X, ChevronDown, Calendar, RotateCcw } from 'lucide-react';
import type { DelegateStatus } from '../types';

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

function FilterDropdown({ label, options, selected, onToggle, onClear, isLoading }: FilterDropdownProps) {
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
                className="rounded-lg cursor-pointer text-xs text-primary"
                onSelect={(e) => e.preventDefault()}
              >
                Clear all
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}
          {isLoading ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Loading {label.toLowerCase()}...
            </div>
          ) : options.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No {label.toLowerCase()} found
            </div>
          ) : (
            options.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={selected.includes(opt.value)}
                onCheckedChange={() => onToggle(opt.value)}
                className="rounded-lg cursor-pointer text-xs"
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const DEFAULT_STATUS_OPTIONS: { value: DelegateStatus; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
  { value: 'suspended', label: 'Suspended' },
];

const PERFORMANCE_OPTIONS = [
  { value: 'all', label: 'All Performance' },
  { value: 'excellent', label: 'Excellent (90%+)' },
  { value: 'good', label: 'Good (80-89%)' },
  { value: 'average', label: 'Average (70-79%)' },
  { value: 'poor', label: 'Poor (<70%)' },
];

export function DelegateFilters() {
  const { filters, setFilter, resetFilters } = useDelegatesStore();
  const [dateOpen, setDateOpen] = useState(false);
  const [realRegions, setRealRegions] = useState<string[]>([]);
  const [realStatuses, setRealStatuses] = useState<string[]>(['online', 'busy', 'offline', 'suspended']);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingOptions(true);

    delegatesService
      .getFilterOptions()
      .then((res) => {
        if (active && res) {
          if (res.regions && res.regions.length > 0) setRealRegions(res.regions);
          if (res.statuses && res.statuses.length > 0) setRealStatuses(res.statuses);
        }
      })
      .catch(async (err) => {
        console.warn('Failed to fetch delegates filter options endpoint, falling back to service calls:', err);
        try {
          const regionsRes = await regionsService.list().catch(() => ({ data: [] }));
          if (active) {
            const rNames = Array.from(new Set((regionsRes.data || []).map((r: any) => r.name).filter(Boolean)));
            setRealRegions(rNames);
          }
        } catch (e) {
          console.error('Fallback fetch also failed:', e);
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeFilterCount =
    filters.status.length +
    filters.region.length +
    (filters.performance !== 'all' ? 1 : 0) +
    (filters.dateRange.start ? 1 : 0);

  const toggleArrayFilter = (key: 'status' | 'region', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  const statusOptions = realStatuses.map((s) => ({
    value: s as DelegateStatus,
    label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '),
  }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search delegates, email, phone..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="pl-9 pr-3 h-8 text-xs rounded-full bg-muted/50 border-border/60"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <FilterDropdown
          label="Status"
          options={statusOptions.length > 0 ? statusOptions : DEFAULT_STATUS_OPTIONS}
          selected={filters.status}
          onToggle={(v) => toggleArrayFilter('status', v)}
          onClear={() => setFilter('status', [])}
          isLoading={loadingOptions}
        />

        {/* Region Filter - Real Data */}
        <FilterDropdown
          label="Region"
          options={realRegions.map((r) => ({ value: r, label: r }))}
          selected={filters.region}
          onToggle={(v) => toggleArrayFilter('region', v)}
          onClear={() => setFilter('region', [])}
          isLoading={loadingOptions}
        />

        {/* Performance Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                filters.performance !== 'all'
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              Performance
              {filters.performance !== 'all' && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Performance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PERFORMANCE_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.performance === opt.value}
                  onCheckedChange={() => setFilter('performance', opt.value as any)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
              Date Range
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
            className="h-8 px-2.5 rounded-full text-xs font-medium gap-1 text-destructive hover:bg-destructive/10"
            onClick={resetFilters}
          >
            <RotateCcw className="h-3 w-3" /> Reset ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}
