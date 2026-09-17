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
import { useNotificationsStore } from '../store';
import { regionsService } from '@/services/regions';
import { Search, X, ChevronDown, Calendar, RefreshCw, FileDown } from 'lucide-react';
import { toast } from 'sonner';

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
            'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors cursor-pointer',
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

const CATEGORY_OPTIONS = [
  { value: 'orders', label: 'Orders' },
  { value: 'stock', label: 'Stock' },
  { value: 'delegates', label: 'Delegates' },
  { value: 'clients', label: 'Clients' },
  { value: 'reports', label: 'Reports' },
  { value: 'security', label: 'Security' },
  { value: 'system', label: 'System' },
  { value: 'finance', label: 'Finance' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

export function NotificationsToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategories,
    setSelectedCategories,
    selectedPriorities,
    setSelectedPriorities,
    selectedStatuses,
    setSelectedStatuses,
    selectedRegions,
    setSelectedRegions,
    dateRange,
    setDateRange,
    triggerRefresh,
    resetFilters,
  } = useNotificationsStore();

  const [dateOpen, setDateOpen] = useState(false);
  const [realRegions, setRealRegions] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  useEffect(() => {
    let active = true;
    regionsService
      .list()
      .then((res) => {
        if (active && res.data) {
          const names = Array.from(new Set(res.data.map((r) => r.name).filter(Boolean)));
          setRealRegions(names);
        }
      })
      .catch((err) => {
        console.error('Failed to load regions for notification filters:', err);
      })
      .finally(() => {
        if (active) setLoadingRegions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeFilterCount =
    selectedCategories.length +
    selectedPriorities.length +
    selectedStatuses.length +
    selectedRegions.length +
    (dateRange?.start ? 1 : 0);

  const toggleArrayFilter = (
    key: 'categories' | 'priorities' | 'statuses' | 'regions',
    value: string
  ) => {
    if (key === 'categories') {
      const next = selectedCategories.includes(value)
        ? selectedCategories.filter((v) => v !== value)
        : [...selectedCategories, value];
      setSelectedCategories(next);
    } else if (key === 'priorities') {
      const next = selectedPriorities.includes(value)
        ? selectedPriorities.filter((v) => v !== value)
        : [...selectedPriorities, value];
      setSelectedPriorities(next);
    } else if (key === 'statuses') {
      const next = selectedStatuses.includes(value)
        ? selectedStatuses.filter((v) => v !== value)
        : [...selectedStatuses, value];
      setSelectedStatuses(next);
    } else if (key === 'regions') {
      const next = selectedRegions.includes(value)
        ? selectedRegions.filter((v) => v !== value)
        : [...selectedRegions, value];
      setSelectedRegions(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notifications, title, user, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 h-8 text-xs rounded-full bg-muted/50 border-border/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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
          selected={selectedCategories}
          onToggle={(v) => toggleArrayFilter('categories', v)}
          onClear={() => setSelectedCategories([])}
        />

        {/* Priority Filter */}
        <FilterDropdown
          label="Priority"
          options={PRIORITY_OPTIONS}
          selected={selectedPriorities}
          onToggle={(v) => toggleArrayFilter('priorities', v)}
          onClear={() => setSelectedPriorities([])}
        />

        {/* Status Filter */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatuses}
          onToggle={(v) => toggleArrayFilter('statuses', v)}
          onClear={() => setSelectedStatuses([])}
        />

        {/* Region Filter - Real Data */}
        <FilterDropdown
          label="Region"
          options={realRegions.map((r) => ({ value: r, label: r }))}
          selected={selectedRegions}
          onToggle={(v) => toggleArrayFilter('regions', v)}
          onClear={() => setSelectedRegions([])}
          isLoading={loadingRegions}
        />

        {/* Date Range Popover */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors cursor-pointer',
                dateRange?.start
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <Calendar className="h-3 w-3" />
              Date Range
              {dateRange?.start && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 rounded-xl p-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Filter by Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">From</label>
                  <Input
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) =>
                      setDateRange({
                        start: e.target.value,
                        end: dateRange?.end || '',
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase">To</label>
                  <Input
                    type="date"
                    value={dateRange?.end || ''}
                    onChange={(e) =>
                      setDateRange({
                        start: dateRange?.start || '',
                        end: e.target.value,
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setDateOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
                  onClick={() => setDateOpen(false)}
                >
                  Apply
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
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-full text-xs font-medium gap-1.5 border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 cursor-pointer"
            title="Refresh Notifications"
            onClick={() => {
              triggerRefresh();
              toast.success('Notifications refreshed');
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-full text-xs font-medium gap-1.5 border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 cursor-pointer"
            title="Export Notifications"
            onClick={() => toast.success('Notifications export started')}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
