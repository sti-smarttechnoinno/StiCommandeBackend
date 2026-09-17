'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { regionsService, type CreateRegionParams } from '@/services/regions';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { WILAYAS_LIST } from '@/features/delegates/components/create-delegate-form';
import { toast } from 'sonner';
import {
  Globe,
  MapPin,
  Users,
  Check,
  X,
  Loader2,
  Sparkles,
  Search,
  Plus,
  Palette,
  Trash2,
} from 'lucide-react';
import type { RegionData } from '../types';

interface CreateRegionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionToEdit?: RegionData | null;
  onSaved: (region: RegionData) => void;
  onDelete?: (region: RegionData) => void;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#2563EB', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  { name: 'Red', hex: '#D71920', bg: 'bg-primary/10', text: 'text-primary' },
  { name: 'Green', hex: '#22C55E', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  { name: 'Amber', hex: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  { name: 'Purple', hex: '#8B5CF6', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  { name: 'Indigo', hex: '#6366F1', bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
];

const PRESET_ICONS = ['🗺️', '🏛️', '🌊', '🏜️', '🏔️', '⚡', '🏢', '📍'];

export function CreateRegionDialog({
  open,
  onOpenChange,
  regionToEdit,
  onSaved,
  onDelete,
}: CreateRegionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'wilayas' | 'delegates'>('info');

  // Form states
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [icon, setIcon] = useState('🗺️');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Customization: Selected Wilaya Codes & Delegates
  const [selectedWilayaCodes, setSelectedWilayaCodes] = useState<string[]>([]);
  const [selectedDelegateIds, setSelectedDelegateIds] = useState<string[]>([]);
  const [wilayaSearch, setWilayaSearch] = useState('');

  // Available delegates from backend
  const [availableDelegates, setAvailableDelegates] = useState<DelegateData[]>([]);
  const [loadingDelegates, setLoadingDelegates] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch delegates list
      setLoadingDelegates(true);
      delegatesService.list({ pageSize: 100 })
        .then((res) => setAvailableDelegates(res.data))
        .catch(() => {})
        .finally(() => setLoadingDelegates(false));

      if (regionToEdit) {
        setName(regionToEdit.name || '');
        setSubtitle(regionToEdit.subtitle || '');
        setIcon(regionToEdit.icon || '🗺️');
        const colorMatch = PRESET_COLORS.find(c => c.hex.toLowerCase() === regionToEdit.color?.toLowerCase()) || PRESET_COLORS[0];
        setSelectedColor(colorMatch);
        const existingCodes = regionToEdit.wilayas.map(w => w.code);
        setSelectedWilayaCodes(existingCodes);
      } else {
        setName('');
        setSubtitle('');
        setIcon('🗺️');
        setSelectedColor(PRESET_COLORS[0]);
        setSelectedWilayaCodes([]);
        setSelectedDelegateIds([]);
      }
      setActiveTab('info');
    }
  }, [open, regionToEdit]);

  const toggleWilayaCode = (code: string) => {
    setSelectedWilayaCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleDelegateId = (id: string) => {
    setSelectedDelegateIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const parsedWilayas = WILAYAS_LIST.map((w) => {
    const parts = w.split(' - ');
    return { code: parts[0], name: parts[1] || w, raw: w };
  });

  const filteredWilayas = parsedWilayas.filter(
    (w) =>
      w.name.toLowerCase().includes(wilayaSearch.toLowerCase()) ||
      w.code.includes(wilayaSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a Region Name.');
      setActiveTab('info');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateRegionParams = {
        name: name.trim(),
        subtitle: subtitle.trim() || `${name.trim()} Algeria Distribution Zone`,
        icon,
        color: selectedColor.hex,
        bg_color: selectedColor.bg,
        text_color: selectedColor.text,
        wilaya_codes: selectedWilayaCodes,
        delegate_ids: selectedDelegateIds,
      };

      let result: RegionData;
      if (regionToEdit) {
        result = await regionsService.update(regionToEdit.dbId || regionToEdit.id, payload);
        toast.success(`Region "${name}" updated successfully!`);
      } else {
        result = await regionsService.create(payload);
        toast.success(`Region "${name}" created successfully!`);
      }

      onSaved(result);
      onOpenChange(false);
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      let msg = 'Failed to save region';
      if (validationErrors && typeof validationErrors === 'object') {
        const firstErrorArray = Object.values(validationErrors)[0];
        if (Array.isArray(firstErrorArray) && firstErrorArray[0]) {
          msg = String(firstErrorArray[0]);
        }
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[92vw] sm:max-w-[780px] md:max-w-[840px] rounded-2xl p-0 overflow-hidden bg-card text-card-foreground shadow-xl border border-border/60">
        {/* Modal Header */}
        <DialogHeader className="px-8 py-6 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                {regionToEdit ? <Globe className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{regionToEdit ? 'Edit Region & Customization' : 'Create New Region'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure region settings, customize assigned wilayas, and set commercial delegates.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex items-center gap-2 mt-5 pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'info'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-background hover:bg-muted/60 text-muted-foreground border border-border/40'
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Region Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wilayas')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'wilayas'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-background hover:bg-muted/60 text-muted-foreground border border-border/40'
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Customize Wilayas ({selectedWilayaCodes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delegates')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'delegates'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-background hover:bg-muted/60 text-muted-foreground border border-border/40'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Commercial Delegates ({selectedDelegateIds.length})</span>
            </button>
          </div>
        </DialogHeader>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-8 py-7 max-h-[65vh] overflow-y-auto">
            {/* TAB 1: General Info */}
            {activeTab === 'info' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Region Name */}
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="region-name" className="text-xs font-bold text-foreground flex items-center gap-1">
                      Region Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="region-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. High Plateaus, Center, East..."
                      className="h-10 text-xs bg-background rounded-xl border-border/70"
                      required
                    />
                  </div>

                  {/* Subtitle / Description */}
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="region-subtitle" className="text-xs font-bold text-foreground">
                      Subtitle / Description
                    </label>
                    <Input
                      id="region-subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Central Algeria Distribution Zone"
                      className="h-10 text-xs bg-background rounded-xl border-border/70"
                    />
                  </div>

                  {/* Icon Selector */}
                  <div className="space-y-2 sm:col-span-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      Region Icon
                    </label>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {PRESET_ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={cn(
                            'w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer',
                            icon === ic
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-105'
                              : 'border-border/60 bg-background hover:bg-muted'
                          )}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Accent Picker */}
                  <div className="space-y-2 sm:col-span-1">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5 text-primary" /> Accent Color
                    </label>
                    <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer',
                            selectedColor.hex === c.hex
                              ? 'border-foreground scale-110 shadow-sm'
                              : 'border-transparent opacity-80 hover:opacity-100'
                          )}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor.hex === c.hex && <Check className="h-4 w-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Customize Wilayas Assignment */}
            {activeTab === 'wilayas' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/30">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Assign Wilayas to {name || 'Region'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Select which of the 58 Wilayas belong to this geographical region
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedWilayaCodes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWilayaCodes([])}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        Clear Selection
                      </Button>
                    )}
                    <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/10">
                      {selectedWilayaCodes.length} Wilayas Selected
                    </Badge>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={wilayaSearch}
                    onChange={(e) => setWilayaSearch(e.target.value)}
                    placeholder="Search Wilaya name or code..."
                    className="pl-9 h-10 text-xs bg-background rounded-xl border-border/70"
                  />
                </div>

                {/* Wilayas Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredWilayas.map((w) => {
                    const isSelected = selectedWilayaCodes.includes(w.code);
                    return (
                      <button
                        key={w.code}
                        type="button"
                        onClick={() => toggleWilayaCode(w.code)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer text-xs',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs'
                            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        <span className="truncate">
                          <span className="font-mono text-[10px] font-bold mr-1 opacity-70">[{w.code}]</span>
                          {w.name}
                        </span>
                        <Checkbox checked={isSelected} className="ml-1 pointer-events-none" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Customize Commercial Delegates Assignment */}
            {activeTab === 'delegates' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border/30">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Assign Commercial Delegates to {name || 'Region'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Select active commercial representatives for this regional territory
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/10">
                    {selectedDelegateIds.length} Delegates Selected
                  </Badge>
                </div>

                {loadingDelegates ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-muted-foreground">Loading delegates list...</p>
                  </div>
                ) : availableDelegates.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-muted/20 rounded-xl border border-dashed">
                    <Users className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-xs font-bold text-foreground">No Delegates Found</p>
                    <p className="text-[11px] text-muted-foreground">
                      You can create delegates in the Delegates section and assign them to this region.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {availableDelegates.map((del) => {
                      const isSelected = selectedDelegateIds.includes(del.id) || del.region === name;
                      return (
                        <button
                          key={del.id}
                          type="button"
                          onClick={() => toggleDelegateId(del.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30 shadow-2xs'
                              : 'border-border/60 bg-background hover:bg-muted/40'
                          )}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-bold text-xs text-foreground block truncate">{del.name}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {del.email} • {del.wilaya}
                            </span>
                          </div>
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="px-8 py-5 border-t border-border/40 bg-muted/20">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                {regionToEdit && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onDelete(regionToEdit);
                    }}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 rounded-xl h-10 px-3 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Region</span>
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {selectedWilayaCodes.length} wilayas & {selectedDelegateIds.length} delegates customized
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl h-10 px-5 text-xs font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="gap-2 rounded-xl h-10 px-6 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                  ) : (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                  <span>{regionToEdit ? 'Save Region Changes' : 'Create Region'}</span>
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
