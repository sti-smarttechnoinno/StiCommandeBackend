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
import { useReportsStore } from '../store';
import { Search, X, ChevronDown, RefreshCw, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REPORT_TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'delegate', label: 'Delegate' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'stock', label: 'Stock' },
  { value: 'client', label: 'Client' },
  { value: 'regional', label: 'Regional' },
];

const REGION_OPTIONS = [
  { value: 'east', label: 'East' },
  { value: 'center', label: 'Center' },
  { value: 'west', label: 'West' },
  { value: 'south', label: 'South' },
];

const WILAYA_OPTIONS = [
  { value: 'setif', label: 'Setif' },
  { value: 'algiers', label: 'Algiers' },
  { value: 'oran', label: 'Oran' },
  { value: 'constantine', label: 'Constantine' },
  { value: 'annaba', label: 'Annaba' },
];

const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'scheduled', label: 'Scheduled' },
];

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onSelect, onClear }: FilterDropdownProps) {
  const isSelected = Boolean(selected);
  const currentLabel = isSelected ? options.find((o) => o.value === selected)?.label || selected : label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none" nativeButton={false}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
            isSelected
              ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
          )}
        >
          <span>{currentLabel}</span>
          {isSelected && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
              1
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isSelected && (
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
              checked={selected === opt.value}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelect(opt.value);
                } else {
                  onClear();
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
  );
}

export function ReportsFilters() {
  const {
    searchQuery, setSearchQuery,
    selectedRegion, setSelectedRegion,
    selectedWilaya, setSelectedWilaya,
    selectedReportType, setSelectedReportType,
    selectedStatus, setSelectedStatus,
    resetFilters,
  } = useReportsStore();

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedRegion ? 1 : 0) +
    (selectedWilaya ? 1 : 0) +
    (selectedReportType ? 1 : 0) +
    (selectedStatus ? 1 : 0);

  return (
    <div className="bg-card border border-border/40 shadow-xs rounded-2xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Report Type */}
        <FilterDropdown
          label="Report Type"
          options={REPORT_TYPE_OPTIONS}
          selected={selectedReportType}
          onSelect={setSelectedReportType}
          onClear={() => setSelectedReportType('')}
        />

        {/* Region */}
        <FilterDropdown
          label="Region"
          options={REGION_OPTIONS}
          selected={selectedRegion}
          onSelect={setSelectedRegion}
          onClear={() => setSelectedRegion('')}
        />

        {/* Wilaya */}
        <FilterDropdown
          label="Wilaya"
          options={WILAYA_OPTIONS}
          selected={selectedWilaya}
          onSelect={setSelectedWilaya}
          onClear={() => setSelectedWilaya('')}
        />

        {/* Status */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatus}
          onSelect={setSelectedStatus}
          onClear={() => setSelectedStatus('')}
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
            <span>Clear ({activeFilterCount})</span>
          </Button>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1.5"
            onClick={() => toast.success('Reports refreshed')}
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-full text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 gap-1.5"
            onClick={() => toast.success('Reports exported')}
          >
            <FileDown className="h-3 w-3" />
            <span>Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
