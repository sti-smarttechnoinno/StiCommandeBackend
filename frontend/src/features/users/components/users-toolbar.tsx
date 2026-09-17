'use client';

import { useState, useEffect } from 'react';
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
import { useUsersStore } from '../store';
import { rolesService } from '@/services/roles';
import { regionsService } from '@/services/regions';
import { Search, X, ChevronDown, RefreshCw, FileDown } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'authorized', label: 'Autorisé' },
  { value: 'blocked', label: 'Bloqué' },
];

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
      <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
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

export function UsersToolbar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedRoles,
    setSelectedRoles,
    selectedRegions,
    setSelectedRegions,
    selectedStatuses,
    setSelectedStatuses,
    resetFilters,
  } = useUsersStore();

  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [regions, setRegions] = useState<{ value: string; label: string }[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  useEffect(() => {
    let active = true;
    rolesService
      .list()
      .then((data) => {
        if (active && data) {
          setRoles(data.map((r) => ({ value: r.slug, label: r.name })));
        }
      })
      .catch((err) => {
        console.error('Failed to load roles for user filters:', err);
      })
      .finally(() => {
        if (active) setLoadingRoles(false);
      });

    regionsService
      .list()
      .then((res) => {
        if (active && res.data) {
          const names = Array.from(new Set(res.data.map((r) => r.name).filter(Boolean)));
          setRegions(names.map((name) => ({ value: name, label: name })));
        }
      })
      .catch((err) => {
        console.error('Failed to load regions for user filters:', err);
      })
      .finally(() => {
        if (active) setLoadingRegions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeFilterCount =
    selectedRoles.length +
    selectedRegions.length +
    selectedStatuses.length;

  const toggleArrayFilter = (
    key: 'roles' | 'regions' | 'statuses',
    value: string
  ) => {
    if (key === 'roles') {
      const next = selectedRoles.includes(value)
        ? selectedRoles.filter((v) => v !== value)
        : [...selectedRoles, value];
      setSelectedRoles(next);
    } else if (key === 'regions') {
      const next = selectedRegions.includes(value)
        ? selectedRegions.filter((v) => v !== value)
        : [...selectedRegions, value];
      setSelectedRegions(next);
    } else if (key === 'statuses') {
      const next = selectedStatuses.includes(value)
        ? selectedStatuses.filter((v) => v !== value)
        : [...selectedStatuses, value];
      setSelectedStatuses(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 h-8 text-xs rounded-full bg-muted/50 border-border/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Role Filter (Real data from rolesService) */}
        <FilterDropdown
          label="Role"
          options={roles}
          selected={selectedRoles}
          onToggle={(v) => toggleArrayFilter('roles', v)}
          onClear={() => setSelectedRoles([])}
          isLoading={loadingRoles}
        />

        {/* Region Filter (Real data from regionsService) */}
        <FilterDropdown
          label="Region"
          options={regions}
          selected={selectedRegions}
          onToggle={(v) => toggleArrayFilter('regions', v)}
          onClear={() => setSelectedRegions([])}
          isLoading={loadingRegions}
        />

        {/* Status Filter (Real data: authorized / blocked) */}
        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatuses}
          onToggle={(v) => toggleArrayFilter('statuses', v)}
          onClear={() => setSelectedStatuses([])}
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

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-full text-xs font-medium gap-1.5 border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 cursor-pointer"
            title="Refresh Users"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('refresh-users'));
              toast.success('Users refreshed');
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 rounded-full text-xs font-medium gap-1.5 border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 cursor-pointer"
            title="Export Users"
            onClick={() => toast.success('Users exported')}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
