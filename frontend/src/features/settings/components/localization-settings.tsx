'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  warehousesService,
  type WarehouseData,
  type CreateWarehouseParams,
} from '@/services/warehouses';
import { regionsService, type RegionData } from '@/services/regions';
import { wilayasService, type WilayaData } from '@/services/wilayas';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Globe,
  Boxes,
  Loader2,
  Settings,
  Sparkles,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  central: { label: 'Central', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  regional: { label: 'Régional', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  local: { label: 'Local', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  transit: { label: 'Transit', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

export function LocalizationSettings() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [wilayas, setWilayas] = useState<WilayaData[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states (no pre-set values so placeholders show)
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number | string>('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [whRes, regRes, wilRes] = await Promise.all([
        warehousesService.list(),
        regionsService.list().catch(() => ({ data: [] })),
        wilayasService.list({ pageSize: 100, sortField: 'rank', sortDirection: 'asc' }).catch(() => ({ data: [] })),
      ]);
      setWarehouses(whRes.data || []);
      setRegions(regRes.data || []);
      setWilayas(wilRes.data || []);
    } catch {
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingWarehouse(null);
    setName('');
    setCode('');
    setType('');
    setWilaya('');
    setRegion('');
    setAddress('');
    setCapacity('');
    setIsActive(true);
    setIsDefault(warehouses.length === 0);
    setNotes('');
    setDialogOpen(true);
  };

  const openEditDialog = (wh: WarehouseData) => {
    setEditingWarehouse(wh);
    setName(wh.name);
    setCode(wh.code);
    setType(wh.type || '');
    setWilaya(wh.wilaya || '');
    setRegion(wh.region || '');
    setAddress(wh.address || '');
    setCapacity(wh.capacity ?? '');
    setIsActive(wh.is_active);
    setIsDefault(wh.is_default);
    setNotes(wh.notes || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom de l'entrepôt est requis");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateWarehouseParams = {
        name: name.trim(),
        code: code.trim() || undefined,
        type,
        wilaya: wilaya.trim() || undefined,
        region: region || undefined,
        address: address.trim() || undefined,
        capacity: capacity !== '' ? Number(capacity) : undefined,
        is_active: isActive,
        is_default: isDefault,
        notes: notes.trim() || undefined,
      };

      if (editingWarehouse) {
        await warehousesService.update(editingWarehouse.id, payload);
        toast.success(`Dépôt "${name}" mis à jour avec succès`);
      } else {
        await warehousesService.create(payload);
        toast.success(`Nouveau dépôt "${name}" ajouté avec succès`);
      }

      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l’enregistrement du dépôt';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (wh: WarehouseData) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'entrepôt "${wh.name}" ?`)) {
      try {
        await warehousesService.delete(wh.id);
        toast.success(`Dépôt "${wh.name}" supprimé`);
        loadData();
      } catch {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSetDefault = async (wh: WarehouseData) => {
    try {
      await warehousesService.setDefault(wh.id);
      toast.success(`"${wh.name}" est désormais le dépôt principal par défaut`);
      loadData();
    } catch {
      toast.error('Impossible de définir comme défaut');
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Dépôts & Entrepôts (Stockage & Expédition) */}
      <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-xs">
                <WarehouseIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Dépôts & Entrepôts</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5">
                    {warehouses.length} site{warehouses.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Configurez vos centres de stockage et entrepôts régionaux (utilisés dans /stock et /products/new)
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={openCreateDialog}
              size="sm"
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Dépôt</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Chargement des dépôts...</span>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
                <Boxes className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Aucun dépôt configuré</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Créez votre premier entrepôt pour gérer le stock initial des produits et les mouvements d&apos;inventaire.
              </p>
              <Button onClick={openCreateDialog} size="sm" className="rounded-full mt-2">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un Entrepôt
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((wh) => {
                const typeCfg = TYPE_CONFIG[wh.type] || TYPE_CONFIG.regional;
                return (
                  <div
                    key={wh.id}
                    className={cn(
                      'relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:shadow-sm',
                      wh.is_default
                        ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                        : 'border-border/60 bg-card hover:border-border'
                    )}
                  >
                    <div className="space-y-3">
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/40">
                            {wh.code}
                          </span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', typeCfg.color)}>
                            {typeCfg.label}
                          </span>
                        </div>
                        {wh.is_default && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-500" /> Par Défaut
                          </Badge>
                        )}
                      </div>

                      {/* Name & Region */}
                      <div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {wh.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="truncate">{wh.wilaya ? `${wh.wilaya}` : 'Wilaya non spécifiée'}</span>
                          {wh.region && <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/80">{wh.region}</span>}
                        </div>
                      </div>

                      {/* Address & Capacity */}
                      <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/30">
                        {wh.address && <p className="truncate">📍 {wh.address}</p>}
                        {wh.capacity ? (
                          <p className="font-medium">Capacité max: <span className="font-bold text-foreground">{wh.capacity.toLocaleString()} unités</span></p>
                        ) : null}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/30">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', wh.is_active ? 'bg-emerald-500' : 'bg-slate-400')} />
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {wh.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!wh.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                            title="Définir comme dépôt principal par défaut"
                            onClick={() => handleSetDefault(wh)}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          title="Modifier"
                          onClick={() => openEditDialog(wh)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Supprimer"
                          onClick={() => handleDelete(wh)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Paramètres Régionaux & Localisation Système */}
      <Card className="border border-border/40 shadow-xs rounded-[20px] bg-card">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Paramètres Régionaux & Système
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Devise monétaire, fuseau horaire et conventions d&apos;affichage pour l&apos;ensemble de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Langue Principale</label>
              <Select defaultValue="fr">
                <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="fr">Français (Algérie)</SelectItem>
                  <SelectItem value="ar">العربية (Algérie)</SelectItem>
                  <SelectItem value="en">English (International)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Fuseau Horaire</label>
              <Select defaultValue="cet">
                <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cet">Africa/Algiers (CET +1:00)</SelectItem>
                  <SelectItem value="utc">UTC (+00:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Devise Commerciale</label>
              <Select defaultValue="dzd">
                <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="dzd">DZD - Dinar Algérien (د.ج)</SelectItem>
                  <SelectItem value="eur">EUR - Euro (€)</SelectItem>
                  <SelectItem value="usd">USD - US Dollar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Format de Date</label>
              <Select defaultValue="ddmmyyyy">
                <SelectTrigger className="h-10 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ddmmyyyy">DD/MM/YYYY (Ex: 31/12/2026)</SelectItem>
                  <SelectItem value="yyyymmdd">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog: Créer / Modifier Dépôt */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <WarehouseIcon className="h-4.5 w-4.5 text-primary" />
              <span>{editingWarehouse ? 'Modifier l’Entrepôt' : 'Ajouter un Nouveau Dépôt'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <WarehouseIcon className="h-3.5 w-3.5 text-primary" />
                  Nom du Dépôt / Entrepôt <span className="text-primary">*</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Entrepôt Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl border-input bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Code Référence
                </label>
                <Input
                  placeholder="Ex: DEP-001 (ou auto-généré)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono uppercase border-input bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Type de Site</label>
                <Select
                  value={type || undefined}
                  onValueChange={(val) => {
                    if (val) setType(val);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs font-medium rounded-xl border border-input bg-background hover:bg-accent/40 focus:ring-2 focus:ring-primary/20 px-3 flex items-center justify-between w-full shadow-2xs">
                    <SelectValue placeholder="Choisir un type de site..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/70 shadow-lg bg-popover z-50 p-1">
                    <SelectItem value="central" className="text-xs font-medium py-2 rounded-lg cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>Central (National)</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="regional" className="text-xs font-medium py-2 rounded-lg cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Régional</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="local" className="text-xs font-medium py-2 rounded-lg cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span>Local</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="transit" className="text-xs font-medium py-2 rounded-lg cursor-pointer">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>Transit / Quai</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Wilaya d&apos;Implantation
                </label>
                <Select
                  value={wilaya || undefined}
                  onValueChange={(val) => {
                    if (val) {
                      setWilaya(val);
                      // Auto-suggest region if available and region not chosen yet
                      const found = wilayas.find((w) => `${w.code} - ${w.name}` === val || w.name === val);
                      if (found && found.regionName && !region) {
                        const matchedReg = regions.find(
                          (r) => r.name.toLowerCase() === found.regionName.toLowerCase()
                        );
                        if (matchedReg) {
                          setRegion(matchedReg.name);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-10 text-xs font-medium rounded-xl border border-input bg-background hover:bg-accent/40 focus:ring-2 focus:ring-primary/20 px-3 flex items-center justify-between w-full shadow-2xs">
                    <SelectValue placeholder="Sélectionner une wilaya..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/70 shadow-lg bg-popover z-50 p-1 max-h-60 overflow-y-auto">
                    {wilayas.length > 0 ? (
                      wilayas.map((w) => (
                        <SelectItem
                          key={w.id || w.code}
                          value={`${w.code} - ${w.name}`}
                          className="text-xs font-medium py-2 rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center justify-between w-full gap-2">
                            <span>
                              <span className="font-mono font-bold text-primary mr-1.5">{w.code}</span>
                              {w.name}
                            </span>
                            {w.regionName && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {w.regionName}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Chargement des wilayas...
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  Région Commerciale
                </label>
                <Select
                  value={region || undefined}
                  onValueChange={(val) => {
                    if (val) setRegion(val);
                  }}
                >
                  <SelectTrigger className="h-10 text-xs font-medium rounded-xl border border-input bg-background hover:bg-accent/40 focus:ring-2 focus:ring-primary/20 px-3 flex items-center justify-between w-full shadow-2xs">
                    <SelectValue placeholder="Sélectionner une région..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/70 shadow-lg bg-popover z-50 p-1">
                    {regions.length > 0 ? (
                      regions.map((r) => (
                        <SelectItem
                          key={r.id}
                          value={r.name}
                          className="text-xs font-medium py-2 rounded-lg cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            <span>{r.name}</span>
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Centre" className="text-xs font-medium py-2 rounded-lg cursor-pointer">Centre</SelectItem>
                        <SelectItem value="Ouest" className="text-xs font-medium py-2 rounded-lg cursor-pointer">Ouest</SelectItem>
                        <SelectItem value="Est" className="text-xs font-medium py-2 rounded-lg cursor-pointer">Est</SelectItem>
                        <SelectItem value="Sud" className="text-xs font-medium py-2 rounded-lg cursor-pointer">Sud</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Adresse complète</label>
                <Input
                  placeholder="Ex: Zone Industrielle, Lot 44"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-10 text-xs rounded-xl border-input bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Capacité maximale (Unités)
                  </label>
                  <span className="text-[10px] text-muted-foreground font-normal">Optionnel</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex: 50 000 (optionnel)"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="h-10 text-xs rounded-xl border-input bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-border/30 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground block">Définir comme dépôt principal par défaut</label>
                  <p className="text-[10px] text-muted-foreground">Sera automatiquement présélectionné dans les formulaires de nouveaux produits</p>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>

              <div className="space-y-1.5 sm:col-span-2 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground block">Site Actif</label>
                  <p className="text-[10px] text-muted-foreground">Permet de recevoir des produits et d&apos;enregistrer des mouvements</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/30">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" className="rounded-full font-bold px-5" disabled={submitting}>
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {editingWarehouse ? 'Enregistrer les modifications' : 'Créer l’Entrepôt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
