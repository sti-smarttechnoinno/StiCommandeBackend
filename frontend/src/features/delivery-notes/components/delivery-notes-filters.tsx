'use client';

import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DeliveryNotesFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  validationType: string;
  onValidationTypeChange: (val: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'in_transit', label: 'En Transit' },
  { value: 'delivered', label: 'Livré' },
  { value: 'pending', label: 'En Attente' },
  { value: 'cancelled', label: 'Annulé' },
];

const VALIDATION_OPTIONS = [
  { value: 'all', label: 'Tous types' },
  { value: 'full', label: 'Validation Totale' },
  { value: 'partial', label: 'Validation Partielle' },
];

export function DeliveryNotesFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  validationType,
  onValidationTypeChange,
  onReset,
}: DeliveryNotesFiltersProps) {
  const isStatusActive = status !== 'all' && status !== '';
  const isValidationActive = validationType !== 'all' && validationType !== '';
  const activeFilterCount = (search ? 1 : 0) + (isStatusActive ? 1 : 0) + (isValidationActive ? 1 : 0);

  const currentStatusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label || 'Statut';
  const currentValidationLabel = VALIDATION_OPTIONS.find((v) => v.value === validationType)?.label || 'Type Validation';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher code BL, commande, client..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status Dropdown Pill */}
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
              <span>{isStatusActive ? currentStatusLabel : 'Statut'}</span>
              {isStatusActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Statut BL</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isStatusActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onStatusChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={status === opt.value}
                  onCheckedChange={() => onStatusChange(opt.value)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Validation Type Dropdown Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isValidationActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isValidationActive ? currentValidationLabel : 'Type Validation'}</span>
              {isValidationActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Type de Validation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isValidationActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onValidationTypeChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {VALIDATION_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={validationType === opt.value}
                  onCheckedChange={() => onValidationTypeChange(opt.value)}
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
            className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10"
            onClick={onReset}
          >
            <X className="h-3 w-3" />
            <span>Effacer ({activeFilterCount})</span>
          </Button>
        )}
      </div>
    </div>
  );
}