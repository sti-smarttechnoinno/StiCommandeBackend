'use client';

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRegionsStore } from '../store';
import { formatCurrency, getStatusColor, getStatusDot, getStatusLabel } from '../utils';
import type { RegionData, Wilaya } from '../types';
import {
  ChevronDown,
  MapPin,
  Users,
  UserCheck,
  ShoppingCart,
  DollarSign,
  Eye,
  Pencil,
  UserPlus,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

const WilayaCard = memo(function WilayaCard({ wilaya, onOpen }: { wilaya: Wilaya; onOpen: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="border border-border/40 shadow-xs rounded-xl overflow-hidden hover:shadow-md hover:border-border/60 transition-all duration-200 cursor-pointer group bg-card"
        onClick={() => onOpen(wilaya.id)}
      >
        <CardContent className="p-3.5 space-y-2.5">
          {/* Top Header: Code + Name + Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">
                {wilaya.code}
              </span>
              <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {wilaya.name}
              </h4>
            </div>

            <div className="flex items-center gap-1">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border-none', getStatusColor(wilaya.status))}>
                <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(wilaya.status))} />
                {getStatusLabel(wilaya.status)}
              </span>

              <button
                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); toast.info(`Menu for ${wilaya.name}`); }}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Delegate Row */}
          {wilaya.delegate ? (
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/40 border border-border/30">
              <Avatar className="h-6 w-6 rounded-full flex-shrink-0">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {wilaya.delegate.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{wilaya.delegate.name}</p>
              </div>
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', wilaya.delegate.isOnline ? 'bg-emerald-500' : 'bg-slate-300')} />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 border border-dashed border-border/50 text-[11px] text-muted-foreground">
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span className="truncate">Unassigned Delegate</span>
            </div>
          )}

          {/* Compact 2x2 ERP Metrics Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 px-2 rounded-lg bg-muted/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Clients</span>
              <span className="text-xs font-bold text-foreground">{wilaya.clients}</span>
            </div>
            <div className="p-1.5 px-2 rounded-lg bg-muted/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Orders</span>
              <span className="text-xs font-bold text-foreground">{wilaya.ordersToday}</span>
            </div>
            <div className="p-1.5 px-2 rounded-lg bg-muted/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Revenue</span>
              <span className="text-xs font-bold text-foreground">{formatCurrency(wilaya.revenue)}</span>
            </div>
            <div className="p-1.5 px-2 rounded-lg bg-muted/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Coverage</span>
              <span className="text-xs font-bold text-foreground">{wilaya.coverage}%</span>
            </div>
          </div>

          {/* Coverage Bar & Actions Footer */}
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  wilaya.coverage >= 80 ? 'bg-emerald-500' : wilaya.coverage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${wilaya.coverage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Updated {wilaya.lastActivity}</span>

              {/* Quick Action Icons */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="h-6 w-6 p-0 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toast.info(`View ${wilaya.name}`); }}
                  >
                    <Eye className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="h-6 w-6 p-0 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toast.info(`Edit ${wilaya.name}`); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="h-6 w-6 p-0 rounded-md inline-flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); toast.success(`${wilaya.name} deleted`); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

function RegionAccordionCard({
  region,
  onEditRegion,
  onDeleteRegion,
}: {
  region: RegionData;
  onEditRegion?: (region: RegionData) => void;
  onDeleteRegion?: (region: RegionData) => void;
}) {
  const { expandedRegions, toggleRegion, setSelectedWilaya } = useRegionsStore();
  const isExpanded = expandedRegions.has(region.id);

  const handleOpen = useCallback(
    (id: string) => {
      setSelectedWilaya(id);
    },
    [setSelectedWilaya]
  );

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden hover:shadow-md hover:border-border/60 transition-all duration-200 bg-card">
      {/* Region Header Row (High Density ERP Style) */}
      <div
        className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => toggleRegion(region.id)}
      >
        {/* Name & Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-foreground tracking-tight">{region.name} Region</h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-none">
              {region.wilayas.length} Wilayas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{region.subtitle}</p>
        </div>

        {/* Inline Metrics Row */}
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 justify-center">
              <UserCheck className="h-3 w-3" />
              <span className="text-[10px] uppercase font-semibold">Delegates</span>
            </div>
            <span className="text-xs font-bold text-foreground">{region.delegates}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 justify-center">
              <Users className="h-3 w-3" />
              <span className="text-[10px] uppercase font-semibold">Clients</span>
            </div>
            <span className="text-xs font-bold text-foreground">{region.clients.toLocaleString()}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 justify-center">
              <ShoppingCart className="h-3 w-3" />
              <span className="text-[10px] uppercase font-semibold">Orders</span>
            </div>
            <span className="text-xs font-bold text-foreground">{region.ordersToday}</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5 justify-center">
              <DollarSign className="h-3 w-3" />
              <span className="text-[10px] uppercase font-semibold">Revenue</span>
            </div>
            <span className="text-xs font-bold text-foreground">{formatCurrency(region.revenue)}</span>
          </div>
        </div>

        {/* Action Button: Edit / Customize */}
        {onEditRegion && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border/70 hover:bg-primary/10 hover:text-primary hover:border-primary/30 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onEditRegion(region);
            }}
            title="Customize Region, Wilayas & Delegates"
          >
            <Pencil className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Customize</span>
          </Button>
        )}

        {/* Action Button: Delete */}
        {onDeleteRegion && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1.5 border-border/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-destructive/80 flex-shrink-0 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRegion(region);
            }}
            title={`Delete ${region.name} Region`}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
            <span className="hidden sm:inline text-destructive">Delete</span>
          </Button>
        )}

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4.5 w-4.5 text-muted-foreground" />
        </motion.div>
      </div>

      {/* Expanded Wilayas Grid */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/30 pt-4 bg-muted/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {region.wilayas.map((wilaya) => (
                  <WilayaCard key={wilaya.id} wilaya={wilaya} onOpen={handleOpen} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function RegionAccordion({
  regions,
  onEditRegion,
  onDeleteRegion,
}: {
  regions: RegionData[];
  onEditRegion?: (region: RegionData) => void;
  onDeleteRegion?: (region: RegionData) => void;
}) {
  return (
    <div className="space-y-3">
      {regions.map((region) => (
        <RegionAccordionCard
          key={region.id}
          region={region}
          onEditRegion={onEditRegion}
          onDeleteRegion={onDeleteRegion}
        />
      ))}
    </div>
  );
}
