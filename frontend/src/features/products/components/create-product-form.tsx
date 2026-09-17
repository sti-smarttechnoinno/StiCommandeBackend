'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { productsService, type ProductData } from '@/services/products';
import { regionsService } from '@/services/regions';
import { operatorsService, type OperatorData } from '@/services/operators';
import { categoriesService, type CategoryData } from '@/services/categories';
import { warehousesService, type WarehouseData } from '@/services/warehouses';
import type { RegionData } from '@/features/regions/types';
import { ProductStatusBadge, CategoryBadge, OperatorBadge } from './product-badges';
import { formatCurrency } from '../utils';
import {
  Package,
  Sparkles,
  ArrowLeft,
  Check,
  RotateCcw,
  DollarSign,
  Barcode,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  Hash,
  Globe,
  Radio,
  Boxes,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';

const STOCK_PRESETS = [0, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const MIN_STOCK_PRESETS = [10, 25, 50, 100, 250];

const fetchNextProductCode = async (operator: string, category: string): Promise<string> => {
  try {
    const result = await productsService.list({ pageSize: 1, sortField: 'created_at', sortDirection: 'desc' });
    const count = (result.total || 0) + 1;
    const opPrefix = operator ? operator.slice(0, 3).toUpperCase() : 'PRD';
    const catPrefix = category ? category.slice(0, 3).toUpperCase() : 'GEN';
    return `${opPrefix}-${catPrefix}-${String(count).padStart(4, '0')}`;
  } catch {
    return 'PRD-GEN-0001';
  }
};

export function CreateProductForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real Database Operators & Categories
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [realRegions, setRealRegions] = useState<RegionData[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form fields
  const [sku, setSku] = useState('PRD-GEN-0001');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [operator, setOperator] = useState('');
  const [category, setCategory] = useState('');
  const [nominalPrice, setNominalPrice] = useState<number | string>(1000);
  const [trackStock, setTrackStock] = useState<boolean>(true);
  const [stockQuantity, setStockQuantity] = useState<number | string>('');
  const [minStock, setMinStock] = useState<number | string>('');
  const [warehouse, setWarehouse] = useState<string>('');
  const [region, setRegion] = useState('All Regions');
  const [status, setStatus] = useState<ProductData['status']>('active');

  useEffect(() => {
    let active = true;

    // Load operators, categories, regions, and warehouses from backend database
    Promise.all([
      operatorsService.list({ active_only: true }),
      categoriesService.list({ active_only: true }),
      regionsService.list(),
      warehousesService.list({ active_only: true }).catch(() => ({ data: [] })),
    ])
      .then(([opRes, catRes, regRes, whRes]) => {
        if (!active) return;
        if (opRes.data && opRes.data.length > 0) {
          setOperators(opRes.data);
        }
        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
        if (regRes.data) {
          setRealRegions(regRes.data);
        }
        if (whRes.data && whRes.data.length > 0) {
          setWarehouses(whRes.data);
          const defaultWh = whRes.data.find((w: WarehouseData) => w.is_default) || whRes.data[0];
          if (defaultWh) {
            setWarehouse(defaultWh.name);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingLookups(false);
      });

    fetchNextProductCode(operator, category).then((code) => {
      if (active) setSku(code);
    });

    return () => {
      active = false;
    };
  }, [operator, category]);

  const handleGenerateCode = async () => {
    const code = await fetchNextProductCode(operator, category);
    setSku(code);
    toast.success(`Code Produit Généré : ${code}`);
  };

  const handleResetForm = () => {
    setName('');
    setBarcode('');
    setOperator('');
    setCategory('');
    setNominalPrice(1000);
    setTrackStock(true);
    setStockQuantity('');
    setMinStock('');
    const defaultWh = warehouses.find((w) => w.is_default) || warehouses[0];
    setWarehouse(defaultWh ? defaultWh.name : '');
    setRegion('All Regions');
    setStatus('active');
    setErrors({});
    toast.info('Formulaire réinitialisé');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Le nom du produit est requis';
    if (!sku.trim()) errs.sku = 'Le code SKU est requis';
    if (!operator) errs.operator = 'Veuillez choisir un opérateur télécom';
    if (!category) errs.category = 'Veuillez choisir une catégorie';
    if (nominalPrice === '' || Number(nominalPrice) < 0) errs.nominalPrice = 'Le prix nominal doit être positif ou nul';

    // Stock quantity is completely optional! Only validate if a negative value is typed
    if (trackStock && stockQuantity !== '' && Number(stockQuantity) < 0) {
      errs.stockQuantity = 'La quantité de stock ne peut être négative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs avant de soumettre.');
      return;
    }

    setSubmitting(true);
    const isTracking = trackStock && stockQuantity !== '';
    const parsedStock = isTracking ? Math.max(0, parseInt(String(stockQuantity), 10) || 0) : null;
    const parsedMinStock = isTracking && minStock !== '' ? Math.max(0, parseInt(String(minStock), 10) || 0) : null;

    const newProductPayload: Partial<ProductData> = {
      sku: sku.trim(),
      code: sku.trim(),
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      operator,
      category,
      nominalPrice: Number(nominalPrice) || 0,
      price: Number(nominalPrice) || 0,
      discountPercent: 0,
      trackStock: isTracking,
      stockQuantity: parsedStock,
      stock: parsedStock ?? 0,
      minStock: parsedMinStock,
      warehouse: warehouse || (warehouses[0]?.name ?? ''),
      region,
      status: isTracking && parsedStock === 0 ? 'out_of_stock' : status,
    };

    try {
      await productsService.create(newProductPayload);
      toast.success(`Produit "${name}" ajouté avec succès !`);
      router.push('/products');
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || err?.message;
      toast.error(`Erreur lors de l'ajout : ${serverMessage || 'Échec de connexion au serveur'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Action Toolbar Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/products" title="Back to Products">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-3 text-xs font-semibold gap-1.5 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Products</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Reset Form</span>
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="gap-2 rounded-full h-9 px-5 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Save Product</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Product Identification */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Product Identification & Operator</CardTitle>
                  <CardDescription className="text-xs">
                    Basic catalog item information, operator classification, and barcoding.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* SKU Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="sku" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" /> SKU / Product Code <span className="text-primary">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Auto-Formatted
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="ARS-MOB-0001"
                    className="h-10 font-mono font-bold text-sm bg-muted/30 rounded-xl border-border/70 focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCode}
                    className="h-10 px-3.5 rounded-xl text-xs font-semibold gap-1.5 shrink-0 border-border/70"
                    title="Generate Product Code"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    <span>Auto</span>
                  </Button>
                </div>
                {errors.sku && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.sku}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Product Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary" /> Product Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Storm"
                    className={cn(
                      'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                      errors.name && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                  {errors.name && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* EAN / Barcode */}
                <div className="space-y-2">
                  <label htmlFor="barcode" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5 text-muted-foreground" /> EAN / Barcode <span className="text-muted-foreground text-[10px]">(Optional)</span>
                  </label>
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 6125000000001"
                    className="h-10 font-mono text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Telecom Operator Selection (Dynamic from DB) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-emerald-500" /> Telecom Operator <span className="text-primary">*</span>
                  </label>
                  <Select
                    value={operator}
                    onValueChange={(val) => {
                      setOperator(val || '');
                      if (errors.operator) setErrors((prev) => ({ ...prev, operator: '' }));
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs',
                        errors.operator && 'border-rose-500 focus:border-rose-500'
                      )}
                    >
                      <SelectValue placeholder={loadingLookups ? 'Loading operators...' : 'Choose an operator...'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      {operators.map((op) => (
                        <SelectItem key={op.id} value={op.name} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: op.color || '#10b981' }} />
                            <span>{op.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.operator && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.operator}
                    </p>
                  )}
                </div>

                {/* Product Category Selection (Dynamic from DB) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500" /> Product Category <span className="text-primary">*</span>
                  </label>
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      setCategory(val || '');
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs',
                        errors.category && 'border-rose-500 focus:border-rose-500'
                      )}
                    >
                      <SelectValue placeholder={loadingLookups ? 'Loading categories...' : 'Choose a category...'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.category}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Catalog Nominal Base Price */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Catalog Nominal Base Price</CardTitle>
                  <CardDescription className="text-xs">
                    Set the base nominal face value in DZD. Commercial delegates select discount percentages (e.g. 4%) when placing orders.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="nominalPrice" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" /> Nominal Price (Base / Face Value in DZD) <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="nominalPrice"
                    type="number"
                    min={0}
                    step={50}
                    value={nominalPrice}
                    onChange={(e) => setNominalPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder="1000"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-bold pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    DA
                  </div>
                </div>
                {/* Nominal Price Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Valeurs courantes :</span>
                  {[100, 200, 500, 1000, 2000, 5000].map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setNominalPrice(pr)}
                      className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer',
                        Number(nominalPrice) === pr
                          ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-2xs'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                      )}
                    >
                      {pr.toLocaleString()} DA
                    </button>
                  ))}
                </div>
                {errors.nominalPrice && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.nominalPrice}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">Tarification Commandes Délégués :</span>
                <p>
                  Les délégués commerciaux choisissent les remises (0%, 1.5%, 2.75%, 4%, 5%) lors de la commande. Exemple : 4% sur {formatCurrency(Number(nominalPrice) || 0)} donne un prix de vente unitaire de {formatCurrency(Math.round((Number(nominalPrice) || 0) * 0.96))}.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Stock & Inventory Management */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Stock & Attribution Territoriale</CardTitle>
                    <CardDescription className="text-xs">
                      Optionnel : définissez les unités de stock initiales, ou laissez le stock non géré (virtuel / illimité).
                    </CardDescription>
                  </div>
                </div>

                {/* Stock Tracking Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextTrack = !trackStock;
                    setTrackStock(nextTrack);
                    if (!nextTrack) {
                      setStockQuantity('');
                      setMinStock('');
                      setStatus('active');
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs',
                    trackStock
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border/70 hover:bg-muted/80'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', trackStock ? 'bg-primary-foreground' : 'bg-muted-foreground')} />
                  <span>{trackStock ? 'Suivi de Stock Actif' : 'Stock Non Géré / Illimité'}</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!trackStock ? (
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>🌐</span> Stock Non Géré (Illimité / Virtuel)
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Idéal pour les recharges électroniques, crédits mobiles ou produits sans contrainte d&apos;inventaire. Les commandes seront acceptées sans blocage de stock.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTrackStock(true)}
                    className="h-8 text-xs font-semibold rounded-lg"
                  >
                    Activer le suivi d&apos;unités
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Initial Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="stockQuantity" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-primary" /> Unités de Stock Initial <span className="text-muted-foreground text-[10px] font-normal">(Optionnel)</span>
                      </label>
                      <span className="text-[11px] font-bold text-primary">
                        {stockQuantity !== '' ? `${(Number(stockQuantity) || 0).toLocaleString()} unités` : 'Non défini (Optionnel)'}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="stockQuantity"
                        type="number"
                        min={0}
                        value={stockQuantity}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                          setStockQuantity(val);
                          if (val === 0) {
                            setStatus('out_of_stock');
                          } else if (typeof val === 'number' && val > 0 && status === 'out_of_stock') {
                            setStatus('active');
                          }
                        }}
                        placeholder="Ex: 500 (ou laisser vide)"
                        className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-bold pr-20"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        Unités
                      </div>
                    </div>

                    {/* Stock Presets */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Préréglages:</span>
                        {STOCK_PRESETS.map((p) => {
                          const isSelected = Number(stockQuantity) === p && stockQuantity !== '';
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setStockQuantity(p);
                                if (p === 0) {
                                  setStatus('out_of_stock');
                                } else if (status === 'out_of_stock') {
                                  setStatus('active');
                                }
                              }}
                              className={cn(
                                'text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer',
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                                  : 'bg-background hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                              )}
                            >
                              {p === 0 ? '0 (Rupture)' : `${p.toLocaleString()} U`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Stock Adjustment Steppers */}
                      <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Ajustement:</span>
                        {[-100, -10, +10, +100, +500].map((adj) => (
                          <button
                            key={adj}
                            type="button"
                            onClick={() => {
                              const curr = Number(stockQuantity) || 0;
                              const next = Math.max(0, curr + adj);
                              setStockQuantity(next);
                              if (next === 0) {
                                setStatus('out_of_stock');
                              } else if (status === 'out_of_stock') {
                                setStatus('active');
                              }
                            }}
                            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors"
                          >
                            {adj > 0 ? `+${adj}` : adj}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Min Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="minStock" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Seuil Alerte Stock Bas <span className="text-muted-foreground text-[10px] font-normal">(Optionnel)</span>
                      </label>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {minStock !== '' ? `${(Number(minStock) || 0).toLocaleString()} unités` : 'Non défini'}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="minStock"
                        type="number"
                        min={0}
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="Ex: 50"
                        className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-medium pr-20"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        Unités
                      </div>
                    </div>

                    {/* Min Stock Presets */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Seuils:</span>
                        {MIN_STOCK_PRESETS.map((thr) => (
                          <button
                            key={thr}
                            type="button"
                            onClick={() => setMinStock(thr)}
                            className={cn(
                              'text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer',
                              Number(minStock) === thr && minStock !== ''
                                ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-2xs'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                            )}
                          >
                            {thr} U
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warehouse & Distribution Region Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Warehouse Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Warehouse className="h-3.5 w-3.5 text-blue-500" /> Entrepôt d&apos;Origine
                    </label>
                    <Link
                      href="/settings"
                      className="text-[11px] text-primary hover:underline"
                    >
                      Gérer dans Paramètres
                    </Link>
                  </div>
                  {warehouses.length > 0 ? (
                    <Select value={warehouse} onValueChange={(val) => setWarehouse(val || '')}>
                      <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                        <SelectValue placeholder={loadingLookups ? 'Chargement des entrepôts...' : 'Sélectionner l\'entrepôt'} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/60 p-1">
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.name} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span>📦</span>
                              <span className="truncate">{w.name}</span>
                              {w.is_default && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                  Défaut
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-300">
                      <span>Aucun dépôt configuré.</span>
                      <Link
                        href="/settings"
                        className="font-bold underline text-primary ml-2 hover:opacity-80"
                      >
                        Configurer dans Paramètres
                      </Link>
                    </div>
                  )}
                </div>

                {/* Distribution Region Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Zone Régionale de Distribution <span className="text-primary">*</span>
                  </label>
                  <Select value={region} onValueChange={(val) => setRegion(val || '')}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder={loadingLookups ? 'Chargement des régions...' : 'Toutes les régions'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      <SelectItem value="All Regions" className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                        🌐 Toutes les Régions (National)
                      </SelectItem>
                      {realRegions.length > 0 &&
                        realRegions.map((reg) => (
                          <SelectItem key={reg.id} value={reg.name} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span>{reg.icon || '🗺️'}</span>
                              <span>Région {reg.name}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">({reg.wilayas?.length || 0} wilayas)</span>
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-semibold text-foreground">
                  Statut du Produit <span className="text-primary">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(['active', 'inactive', 'draft'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st as any)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all duration-200 cursor-pointer',
                        status === st
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-2xs'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/60'
                      )}
                    >
                      <ProductStatusBadge product={{ status: st, stock: trackStock && stockQuantity !== '' ? Number(stockQuantity) : null, minStock: Number(minStock) || 0, trackStock } as any} />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Product Card Preview Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Aperçu du Produit</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Live Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1">
                      {name.trim() || 'Nom du Produit'}
                    </h3>
                    <p className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1">
                      {sku}
                    </p>
                  </div>
                  <ProductStatusBadge product={{ status, stock: trackStock && stockQuantity !== '' ? Number(stockQuantity) : null, minStock: Number(minStock) || 0, trackStock } as any} />
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <OperatorBadge operator={operator} />
                  <CategoryBadge category={category} />
                </div>
              </div>

              <div className="h-px bg-border/40" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Prix Nominal (Base) :</span>
                  <span className="font-bold text-sm text-foreground">{formatCurrency(Number(nominalPrice) || 0)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Unités en Stock :</span>
                  <span className="font-bold text-foreground">
                    {!trackStock || stockQuantity === ''
                      ? 'Non géré / Illimité'
                      : `${(Number(stockQuantity) || 0).toLocaleString()} unités`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Entrepôt :</span>
                  <span className="font-medium text-foreground text-right">{warehouse}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Portée Régionale :</span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-border/70 text-foreground bg-muted/30">
                    {region}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">Commandes Délégués Mobiles :</span>
                <p>
                  Les délégués sélectionnent le taux de remise (ex. 4%) lors de la prise de commande. Prix net estimé : {formatCurrency(Math.round((Number(nominalPrice) || 0) * 0.96))}.
                </p>
              </div>
            </CardContent>

            <div className="p-4 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetForm}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2 rounded-xl h-8 px-4 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" /> : <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                <span>Create Product</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
