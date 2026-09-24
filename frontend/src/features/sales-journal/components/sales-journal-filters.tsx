'use client';

import React from 'react';
import { Search, X, ChevronDown, Calendar, Filter } from 'lucide-react';
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
import type { SalesJournalFilterOptions } from '@/services/sales-journal';

interface SalesJournalFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  delegate: string;
  onDelegateChange: (val: string) => void;
  wilaya: string;
  onWilayaChange: (val: string) => void;
  paymentMode: string;
  onPaymentModeChange: (val: string) => void;
  depot: string;
  onDepotChange: (val: string) => void;
  matched: string;
  onMatchedChange: (val: string) => void;
  onlyRemaining: boolean;
  onOnlyRemainingChange: (val: boolean) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  onReset: () => void;
  filterOptions: SalesJournalFilterOptions;
}

const MATCHED_OPTIONS = [
  { value: 'all', label: 'Tous tiers' },
  { value: 'matched', label: 'Clients Reconnus STI' },
  { value: 'unmatched', label: 'Non Réconciliés' },
];

export function SalesJournalFilters({
  search,
  onSearchChange,
  delegate,
  onDelegateChange,
  wilaya,
  onWilayaChange,
  paymentMode,
  onPaymentModeChange,
  depot,
  onDepotChange,
  matched,
  onMatchedChange,
  onlyRemaining,
  onOnlyRemainingChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onReset,
  filterOptions,
}: SalesJournalFiltersProps) {
  const isDelegateActive = delegate !== 'all' && delegate !== '';
  const isWilayaActive = wilaya !== 'all' && wilaya !== '';
  const isPaymentModeActive = paymentMode !== 'all' && paymentMode !== '';
  const isDepotActive = depot !== 'all' && depot !== '';
  const isMatchedActive = matched !== 'all' && matched !== '';
  const isDateActive = Boolean(dateFrom || dateTo);

  const activeFilterCount =
    (search ? 1 : 0) +
    (isDelegateActive ? 1 : 0) +
    (isWilayaActive ? 1 : 0) +
    (isPaymentModeActive ? 1 : 0) +
    (isDepotActive ? 1 : 0) +
    (isMatchedActive ? 1 : 0) +
    (onlyRemaining ? 1 : 0) +
    (isDateActive ? 1 : 0);

  const currentDelegateName =
    filterOptions.delegates.find((d) => String(d.id) === delegate)?.name || 'Délégué STI';
  const currentMatchedLabel =
    MATCHED_OPTIONS.find((m) => m.value === matched)?.label || 'Rapprochement';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher tiers, réf BL, code client..."
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

        {/* Délégué Dropdown Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isDelegateActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isDelegateActive ? currentDelegateName : 'Délégué STI'}</span>
              {isDelegateActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl p-1.5 max-h-64 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Délégué Commercial</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isDelegateActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onDelegateChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuCheckboxItem
                checked={delegate === 'all'}
                onCheckedChange={() => onDelegateChange('all')}
                className="rounded-lg cursor-pointer text-xs"
              >
                Tous les délégués
              </DropdownMenuCheckboxItem>
              {filterOptions.delegates.map((d) => (
                <DropdownMenuCheckboxItem
                  key={d.id}
                  checked={delegate === String(d.id)}
                  onCheckedChange={() => onDelegateChange(String(d.id))}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {d.name} {d.wilaya ? `(${d.wilaya})` : ''}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Wilaya Dropdown Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isWilayaActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isWilayaActive ? wilaya : 'Wilaya'}</span>
              {isWilayaActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5 max-h-64 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Wilaya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isWilayaActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onWilayaChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuCheckboxItem
                checked={wilaya === 'all'}
                onCheckedChange={() => onWilayaChange('all')}
                className="rounded-lg cursor-pointer text-xs"
              >
                Toutes les wilayas
              </DropdownMenuCheckboxItem>
              {filterOptions.wilayas.map((w) => (
                <DropdownMenuCheckboxItem
                  key={w}
                  checked={wilaya === w}
                  onCheckedChange={() => onWilayaChange(w)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {w}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mode de Règlement Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isPaymentModeActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isPaymentModeActive ? paymentMode : 'Mode Règlement'}</span>
              {isPaymentModeActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Mode Règlement</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isPaymentModeActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onPaymentModeChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuCheckboxItem
                checked={paymentMode === 'all'}
                onCheckedChange={() => onPaymentModeChange('all')}
                className="rounded-lg cursor-pointer text-xs"
              >
                Tous les modes
              </DropdownMenuCheckboxItem>
              {filterOptions.paymentModes.map((m) => (
                <DropdownMenuCheckboxItem
                  key={m}
                  checked={paymentMode === m}
                  onCheckedChange={() => onPaymentModeChange(m)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {m}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dépôt Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isDepotActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isDepotActive ? depot : 'Dépôt'}</span>
              {isDepotActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5 max-h-64 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Dépôt Source</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isDepotActive && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onDepotChange('all')}
                    className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Effacer le filtre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuCheckboxItem
                checked={depot === 'all'}
                onCheckedChange={() => onDepotChange('all')}
                className="rounded-lg cursor-pointer text-xs"
              >
                Tous les dépôts
              </DropdownMenuCheckboxItem>
              {filterOptions.depots.map((dp) => (
                <DropdownMenuCheckboxItem
                  key={dp}
                  checked={depot === dp}
                  onCheckedChange={() => onDepotChange(dp)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {dp}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rapprochement STI Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none" nativeButton={false}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                isMatchedActive
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
              )}
            >
              <span>{isMatchedActive ? currentMatchedLabel : 'Rapprochement'}</span>
              {isMatchedActive && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                  1
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Rapprochement Client STI</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MATCHED_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={matched === opt.value}
                  onCheckedChange={() => onMatchedChange(opt.value)}
                  className="rounded-lg cursor-pointer text-xs"
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Only Remaining Toggle Pill */}
        <button
          type="button"
          onClick={() => onOnlyRemainingChange(!onlyRemaining)}
          className={cn(
            'h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer select-none',
            onlyRemaining
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 font-semibold'
              : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full', onlyRemaining ? 'bg-rose-500' : 'bg-muted-foreground/40')} />
          <span>Reste dû uniquement</span>
        </button>

        {/* Date Inputs Pill */}
        <div className="flex items-center gap-1 bg-muted/40 border border-border/60 rounded-full h-8 px-2.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="bg-transparent border-0 text-xs focus:outline-none text-foreground w-24"
            title="Date début"
          />
          <span className="text-muted-foreground/60">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="bg-transparent border-0 text-xs focus:outline-none text-foreground w-24"
            title="Date fin"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                onDateFromChange('');
                onDateToChange('');
              }}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Reset Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>Effacer ({activeFilterCount})</span>
          </Button>
        )}
      </div>
    </div>
  );
}
