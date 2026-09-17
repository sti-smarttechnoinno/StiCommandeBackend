'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useRegionsStore } from '../store';
import { Search, X, ChevronDown, ChevronUp, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export function RegionToolbar() {
  const { filters, setFilter, resetFilters, expandAll, collapseAll } = useRegionsStore();

  const isRegionActive = filters.region.length > 0;
  const isStatusActive = filters.status.length > 0;
  const activeFilterCount = (filters.search ? 1 : 0) + (isRegionActive ? 1 : 0) + (isStatusActive ? 1 : 0);

  const currentRegionLabel = isRegionActive
    ? REGION_OPTIONS.find((r) => r.value === filters.region[0])?.label || filters.region[0]
    : 'Region';

  const currentStatusLabel = isStatusActive
    ? STATUS_OPTIONS.find((s) => s.value === filters.status[0])?.label || filters.status[0]
    : 'Status';

  return (
    <div className="bg-card border border-border/40 shadow-xs rounded-2xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search region, wilaya or delegate..."
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

        {/* Region Filter Dropdown Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isRegionActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isRegionActive ? currentRegionLabel : 'Region'}</span>
              {isRegionActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  {filters.region.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Region</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isRegionActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setFilter('region', [])}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {REGION_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.region.includes(opt.value as any)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilter('region', [opt.value as any]);
                    } else {
                      setFilter('region', []);
                    }
                  }}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter Dropdown Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isStatusActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isStatusActive ? currentStatusLabel : 'Status'}</span>
              {isStatusActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isStatusActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setFilter('status', [])}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear all
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={filters.status.includes(opt.value as any)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilter('status', [opt.value as any]);
                    } else {
                      setFilter('status', []);
                    }
                  }}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filter Button */}
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

        {/* Right Action Tools: Expand/Collapse & Refresh */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1"
            onClick={expandAll}
          >
            <ChevronDown className="h-3 w-3" />
            <span>Expand All</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1"
            onClick={collapseAll}
          >
            <ChevronUp className="h-3 w-3" />
            <span>Collapse All</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
