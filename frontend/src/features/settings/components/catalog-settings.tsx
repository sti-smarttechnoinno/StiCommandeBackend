'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { operatorsService, type OperatorData } from '@/services/operators';
import { categoriesService, type CategoryData } from '@/services/categories';
import {
  Radio,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Loader2,
  Sparkles,
  Tag,
  Hash,
  AlertCircle,
  Zap,
  Truck,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export function CatalogSettings() {
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state for Operator
  const [opDialogOpen, setOpDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<OperatorData | null>(null);
  const [opName, setOpName] = useState('');
  const [opCode, setOpCode] = useState('');
  const [opColor, setOpColor] = useState('#10b981');
  const [submittingOp, setSubmittingOp] = useState(false);

  // Dialog state for Category
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('package');
  const [catWorkflowType, setCatWorkflowType] = useState<'virtual' | 'physical'>('physical');
  const [catRequiresDelivery, setCatRequiresDelivery] = useState<boolean>(true);
  const [submittingCat, setSubmittingCat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [opRes, catRes] = await Promise.all([
        operatorsService.list(),
        categoriesService.list(),
      ]);
      setOperators(opRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error('Failed to load operators or categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Operator Actions ---
  const handleOpenOpDialog = (op?: OperatorData) => {
    if (op) {
      setEditingOp(op);
      setOpName(op.name);
      setOpCode(op.code);
      setOpColor(op.color || '#10b981');
    } else {
      setEditingOp(null);
      setOpName('');
      setOpCode('');
      setOpColor('#10b981');
    }
    setOpDialogOpen(true);
  };

  const handleSaveOperator = async () => {
    if (!opName.trim() || !opCode.trim()) {
      toast.error('Name and Code are required.');
      return;
    }
    setSubmittingOp(true);
    try {
      if (editingOp) {
        await operatorsService.update(editingOp.id, {
          name: opName.trim(),
          code: opCode.trim().toUpperCase(),
          color: opColor,
        });
        toast.success(`Operator "${opName}" updated!`);
      } else {
        await operatorsService.create({
          name: opName.trim(),
          code: opCode.trim().toUpperCase(),
          color: opColor,
          is_active: true,
        });
        toast.success(`Operator "${opName}" created!`);
      }
      setOpDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save operator');
    } finally {
      setSubmittingOp(false);
    }
  };

  const handleToggleOpActive = async (op: OperatorData) => {
    try {
      await operatorsService.update(op.id, { is_active: !op.is_active });
      setOperators((prev) =>
        prev.map((item) => (item.id === op.id ? { ...item, is_active: !item.is_active } : item))
      );
      toast.success(`Operator "${op.name}" ${!op.is_active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteOp = async (op: OperatorData) => {
    if (!confirm(`Are you sure you want to delete operator "${op.name}"?`)) return;
    try {
      await operatorsService.delete(op.id);
      toast.success(`Operator "${op.name}" deleted!`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete operator');
    }
  };

  // --- Category Actions ---
  const handleOpenCatDialog = (cat?: CategoryData) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatDesc(cat.description || '');
      setCatIcon(cat.icon || 'package');
      const isVirt = cat.workflow_type === 'virtual' || (!cat.requires_delivery && cat.workflow_type !== 'physical');
      setCatWorkflowType(isVirt ? 'virtual' : 'physical');
      setCatRequiresDelivery(!isVirt);
    } else {
      setEditingCat(null);
      setCatName('');
      setCatDesc('');
      setCatIcon('package');
      setCatWorkflowType('physical');
      setCatRequiresDelivery(true);
    }
    setCatDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setSubmittingCat(true);
    try {
      const payload = {
        name: catName.trim(),
        description: catDesc.trim(),
        icon: catIcon,
        workflow_type: catWorkflowType,
        requires_delivery: catRequiresDelivery,
      };

      if (editingCat) {
        await categoriesService.update(editingCat.id, payload);
        toast.success(`Category "${catName}" updated!`);
      } else {
        await categoriesService.create({
          ...payload,
          is_active: true,
        });
        toast.success(`Category "${catName}" created!`);
      }
      setCatDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleToggleCatActive = async (cat: CategoryData) => {
    try {
      await categoriesService.update(cat.id, { is_active: !cat.is_active });
      setCategories((prev) =>
        prev.map((item) => (item.id === cat.id ? { ...item, is_active: !item.is_active } : item))
      );
      toast.success(`Category "${cat.name}" ${!cat.is_active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteCat = async (cat: CategoryData) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await categoriesService.delete(cat.id);
      toast.success(`Category "${cat.name}" deleted!`);
      loadData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Telecom Operators & Product Categories
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure dynamic operators and catalog categories saved in database and fetched across product creation and filters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2 rounded-full h-9 px-4 text-xs font-semibold bg-card hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Grid: 2 Columns (Operators & Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Telecom Operators */}
        <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Telecom Operators</CardTitle>
                <CardDescription className="text-xs">
                  Supported mobile network operators in Algeria.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenOpDialog()}
              className="gap-1.5 rounded-full h-8 px-3 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Operator</span>
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Loading operators...</p>
              </div>
            ) : operators.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No operators configured yet. Click "Add Operator" to create one.
              </div>
            ) : (
              operators.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: op.color || '#10b981' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{op.name}</span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] font-bold px-1.5 py-0.2 border-primary/30 text-primary bg-primary/10"
                        >
                          {op.code}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={op.is_active}
                        onCheckedChange={() => handleToggleOpActive(op)}
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {op.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-border/40 pl-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenOpDialog(op)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOp(op)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 2: Product Categories */}
        <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Product Categories</CardTitle>
                <CardDescription className="text-xs">
                  Catalog product categories and classifications.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenCatDialog()}
              className="gap-1.5 rounded-full h-8 px-3 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No categories configured yet. Click "Add Category" to create one.
              </div>
            ) : (
              categories.map((cat) => {
                const isVirtual = cat.workflow_type === 'virtual' || (!cat.requires_delivery && cat.workflow_type !== 'physical');
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex-wrap gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/60">
                          {cat.slug}
                        </Badge>
                        {isVirtual ? (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                            <Zap className="h-3 w-3" /> Recharge & Virtuel (En attente ➔ Validée)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1">
                            <Truck className="h-3 w-3" /> SIM & Tickets (En attente ➔ Validée ➔ Expédition ➔ Livrée)
                          </Badge>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={cat.is_active}
                          onCheckedChange={() => handleToggleCatActive(cat)}
                        />
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {cat.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-border/40 pl-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCatDialog(cat)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCat(cat)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Workflow Explanation & Rules Card - Full Width */}
      <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden w-full">
        <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">
                Cycles de Statuts & Acheminement des Commandes
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Règles de génération automatique du statut et du suivi logistique selon les catégories d&apos;articles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Virtual Flow Card */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Zap className="h-4 w-4" />
                <span>Recharges & Télécom Virtuel</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pour les recharges électroniques et forfaits, la commande comporte <strong>2 étapes</strong> : <br />
                <span className="font-mono text-foreground font-semibold">1. En attente ➔ 2. Validée</span>.<br />
                Finalisation directe dès la validation administrative. Aucune expédition requise.
              </p>
            </div>

            {/* Physical Flow Card */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Truck className="h-4 w-4" />
                <span>Cartes SIM & Tickets physiques</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Pour les biens matériels, le cycle complet comporte <strong>4 étapes</strong> : <br />
                <span className="font-mono text-foreground font-semibold">1. En attente ➔ 2. Validée ➔ 3. Expédition ➔ 4. Livrée</span>.<br />
                Acheminement physique par le délégué ou la flotte régionale jusqu&apos;au client.
              </p>
            </div>

            {/* Partial Fulfillment Card */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Gestion du Partiel (Partially Validated)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Lorsqu&apos;une partie des unités est validée ou remise (ex: 20/50 SIM ou 5 000 DA sur 10 000 DA), la commande passe au statut <span className="font-bold text-amber-600">Partiel</span> avec suivi précis des quantités restantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator Add/Edit Dialog */}
      <Dialog open={opDialogOpen} onOpenChange={setOpDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingOp ? 'Edit Telecom Operator' : 'Add Telecom Operator'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure telecom operator name, SKU code prefix, and brand color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Operator Name *</label>
              <Input
                value={opName}
                onChange={(e) => setOpName(e.target.value)}
                placeholder="e.g. Mobilis"
                className="h-10 text-sm rounded-xl border-border/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Code Prefix (3 chars) *</label>
              <Input
                value={opCode}
                onChange={(e) => setOpCode(e.target.value.toUpperCase())}
                placeholder="e.g. MOB"
                maxLength={5}
                className="h-10 font-mono font-bold text-sm rounded-xl border-border/70 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Brand Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={opColor}
                  onChange={(e) => setOpColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-border/70 cursor-pointer p-0.5"
                />
                <Input
                  value={opColor}
                  onChange={(e) => setOpColor(e.target.value)}
                  className="h-10 font-mono text-sm rounded-xl border-border/70"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpDialogOpen(false)}
              className="rounded-full h-9 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submittingOp}
              onClick={handleSaveOperator}
              className="gap-2 rounded-full h-9 px-4 text-xs font-bold bg-primary text-primary-foreground"
            >
              {submittingOp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Operator</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Add/Edit Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCat ? 'Edit Product Category' : 'Add Product Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define catalog item category name and description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category Name *</label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Mobile Credit"
                className="h-10 text-sm rounded-xl border-border/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <Input
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="e.g. Flexy electronic mobile credit top-up"
                className="h-10 text-sm rounded-xl border-border/70"
              />
            </div>

            {/* Workflow Lifecycle Selector */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-primary" /> Cycle de Traitement & Acheminement *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCatWorkflowType('virtual');
                    setCatRequiresDelivery(false);
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer",
                    catWorkflowType === 'virtual'
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Zap className="h-3.5 w-3.5" /> Recharges & Virtuel
                  </div>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    2 étapes : En attente ➔ Validée. Aucune expédition requise.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCatWorkflowType('physical');
                    setCatRequiresDelivery(true);
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer",
                    catWorkflowType === 'physical'
                      ? "border-blue-500 bg-blue-500/10 text-foreground ring-1 ring-blue-500"
                      : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Truck className="h-3.5 w-3.5" /> SIM & Tickets
                  </div>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    4 étapes : En attente ➔ Validée ➔ Expédition ➔ Livrée.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCatDialogOpen(false)}
              className="rounded-full h-9 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submittingCat}
              onClick={handleSaveCategory}
              className="gap-2 rounded-full h-9 px-4 text-xs font-bold bg-primary text-primary-foreground"
            >
              {submittingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Category</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
