'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { clientsService, type ClientData } from '@/services/clients';
import { productsService, type ProductData } from '@/services/products';
import { regionsService } from '@/services/regions';
import { ordersService } from '@/services/orders';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '../utils';
import {
  User,
  Package,
  MapPin,
  FileText,
  ArrowLeft,
  Check,
  RotateCcw,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  Plus,
  Trash2,
  DollarSign,
  Globe,
  UserCheck,
  Search,
  X,
  CheckCircle2,
  Phone,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItemRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export function CreateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClientId = searchParams?.get('clientId') || '';

  const { user, isCommercial, isRestrictedByRegion, region: userRegion } = usePermissions();

  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Reference Data
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  // Territory / Region Selection
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Client Search & Selection State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const clientSearchInputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  // Form State
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRegionLocked = Boolean((isCommercial || isRestrictedByRegion) && (userRegion || user?.region));
  const lockedRegionName = (userRegion || user?.region || '').trim();

  const updateDropdownPosition = useCallback(() => {
    if (!clientSearchInputRef.current) return;
    const rect = clientSearchInputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const showAbove = spaceBelow < 260 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(320, Math.max(160, (showAbove ? spaceAbove : spaceBelow) - 16));

    if (showAbove) {
      setDropdownCoords({
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: 'top',
      });
    } else {
      setDropdownCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: 'bottom',
      });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    updateDropdownPosition();

    const handleScrollResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);

    return () => {
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isSearchOpen, updateDropdownPosition]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        clientSearchInputRef.current &&
        !clientSearchInputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Autofill helper on selecting a client
  const handleSelectClient = (client: ClientData | null) => {
    if (!client) {
      setSelectedClientId('');
      setDeliveryAddress('');
      setIsSearchOpen(false);
      return;
    }

    setSelectedClientId(client.id);
    setIsSearchOpen(false);
    setClientSearchQuery('');

    // AUTOFILL: Delivery address from client profile
    const autofilledAddr = client.address?.trim()
      ? client.address.trim()
      : client.wilaya
      ? `${client.wilaya}, Algérie`
      : '';
    setDeliveryAddress(autofilledAddr);

    // AUTOFILL: Territory / Region if not locked
    if (!isRegionLocked && client.region) {
      setSelectedRegion(client.region);
    }

    // Clear client error
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.client;
      return copy;
    });

    toast.info(`Client « ${client.name} » sélectionné — Adresse et données associées pré-remplies.`);
  };

  useEffect(() => {
    let active = true;
    setLoadingData(true);

    Promise.all([
      clientsService.list({ pageSize: 200 }),
      productsService.list({ pageSize: 100 }),
      regionsService.list().catch(() => ({ data: [], total: 0 })),
    ])
      .then(([clientsRes, productsRes, regionsRes]) => {
        if (!active) return;
        const loadedClients = clientsRes.data || [];
        const loadedProducts = productsRes.data || [];
        setClients(loadedClients);
        setProducts(loadedProducts);

        // Derive unique region names from regions endpoint + clients
        const regNames = Array.from(
          new Set([
            ...(regionsRes.data || []).map((r) => r.name),
            ...loadedClients.map((c) => c.region).filter(Boolean),
          ])
        ).filter(Boolean);
        setAvailableRegions(regNames);

        // If commercial is assigned to a region, lock selectedRegion to it
        const effectiveRegion = (isCommercial || isRestrictedByRegion) && (userRegion || user?.region)
          ? (userRegion || user?.region || '').trim()
          : 'all';
        setSelectedRegion(effectiveRegion);

        // Filter clients based on effective region
        const filtered = effectiveRegion && effectiveRegion !== 'all'
          ? loadedClients.filter((c) => (c.region || '').toLowerCase().trim() === effectiveRegion.toLowerCase())
          : loadedClients;

        // Auto select client: check URL param clientId first, then first available
        const targetUrlClient = urlClientId
          ? loadedClients.find((c) => String(c.id) === String(urlClientId))
          : null;
        const initialClient = targetUrlClient || (filtered.length > 0 ? filtered[0] : null);

        if (initialClient) {
          setSelectedClientId(initialClient.id);
          const autofilledAddr = initialClient.address?.trim()
            ? initialClient.address.trim()
            : initialClient.wilaya
            ? `${initialClient.wilaya}, Algérie`
            : '';
          setDeliveryAddress(autofilledAddr);

          if (!isRegionLocked && initialClient.region && (!effectiveRegion || effectiveRegion === 'all')) {
            setSelectedRegion(initialClient.region);
          }
        }

        // Initialize 1 default product row
        if (loadedProducts.length > 0) {
          const firstProd = loadedProducts[0];
          setItems([
            {
              id: String(Date.now()),
              productId: firstProd.id,
              productName: firstProd.name,
              sku: firstProd.sku || firstProd.code || 'SKU-001',
              quantity: 10,
              unitPrice: Number(firstProd.sellingPrice || firstProd.nominalPrice || firstProd.price || 0),
              discountPercent: Number(firstProd.discountPercent || 0),
            },
          ]);
        }
      })
      .catch(() => {
        if (active) toast.error('Échec du chargement de la liste des clients et produits.');
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [isCommercial, isRestrictedByRegion, userRegion, user?.region, urlClientId]);

  const filteredClients = useMemo(() => {
    const activeReg = isRegionLocked ? lockedRegionName : selectedRegion;
    if (!activeReg || activeReg === 'all') {
      return clients;
    }
    const target = activeReg.toLowerCase().trim();
    return clients.filter((c) => (c.region || '').toLowerCase().trim() === target);
  }, [clients, selectedRegion, isRegionLocked, lockedRegionName]);

  const searchedClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return filteredClients;
    return filteredClients.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const code = (c.clientCode || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const wilaya = (c.wilaya || '').toLowerCase();
      const region = (c.region || '').toLowerCase();
      const rc = (c.rcNumber || '').toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        wilaya.includes(q) ||
        region.includes(q) ||
        rc.includes(q)
      );
    });
  }, [filteredClients, clientSearchQuery]);

  const selectedClient = clients.find((c) => String(c.id) === String(selectedClientId));

  const handleRegionChange = (newRegion: string | null) => {
    const val = newRegion || 'all';
    setSelectedRegion(val);
    const target = val.toLowerCase().trim();
    const matches = val === 'all'
      ? clients
      : clients.filter((c) => (c.region || '').toLowerCase().trim() === target);

    if (matches.length > 0) {
      if (!matches.some((c) => String(c.id) === String(selectedClientId))) {
        handleSelectClient(matches[0]);
      }
    } else {
      setSelectedClientId('');
      setDeliveryAddress('');
    }
  };

  const handleAddRow = () => {
    const firstProd = products[0];
    if (!firstProd) return;

    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        productId: firstProd.id,
        productName: firstProd.name,
        sku: firstProd.sku || firstProd.code || 'SKU-001',
        quantity: 1,
        unitPrice: Number(firstProd.sellingPrice || firstProd.nominalPrice || firstProd.price || 0),
        discountPercent: Number(firstProd.discountPercent || 0),
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (items.length <= 1) {
      toast.warning('Une commande doit comporter au moins 1 article.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== rowId));
  };

  const handleProductChange = (rowId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku || prod.code || 'SKU-001',
              unitPrice: Number(prod.sellingPrice || prod.nominalPrice || prod.price || 0),
              discountPercent: Number(prod.discountPercent || 0),
            }
          : item
      )
    );
  };

  const handleQuantityChange = (rowId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const handleUnitPriceChange = (rowId: string, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId ? { ...item, unitPrice: Math.max(0, price) } : item
      )
    );
  };

  const handleDiscountChange = (rowId: string, discount: number) => {
    const clamped = Math.max(0, Math.min(100, discount));
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId ? { ...item, discountPercent: clamped } : item
      )
    );
  };

  const handleResetForm = () => {
    const defaultReg = isRegionLocked ? lockedRegionName : 'all';
    setSelectedRegion(defaultReg);
    const target = defaultReg.toLowerCase().trim();
    const matches = defaultReg === 'all'
      ? clients
      : clients.filter((c) => (c.region || '').toLowerCase().trim() === target);

    if (matches.length > 0) setSelectedClientId(matches[0].id);
    else setSelectedClientId('');

    if (products.length > 0) {
      const firstProd = products[0];
      setItems([
        {
          id: String(Date.now()),
          productId: firstProd.id,
          productName: firstProd.name,
          sku: firstProd.sku || firstProd.code || 'SKU-001',
          quantity: 10,
          unitPrice: Number(firstProd.sellingPrice || firstProd.nominalPrice || firstProd.price || 0),
          discountPercent: Number(firstProd.discountPercent || 0),
        },
      ]);
    }
    setDeliveryAddress('');
    setNotes('');
    setErrors({});
    toast.info('Formulaire réinitialisé aux valeurs par défaut.');
  };

  const totalAmount = items.reduce((sum, item) => {
    const netPrice = item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    return sum + item.quantity * netPrice;
  }, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedClientId) errs.client = 'Veuillez sélectionner un client bénéficiaire';
    if (items.length === 0) errs.items = 'Au moins 1 produit est requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs signalées avant de soumettre.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        client_id: selectedClientId,
        client_name: selectedClient?.name || '',
        delegate_name: selectedClient?.delegateName || 'Délégué Commercial',
        region: selectedClient?.region || 'Algiers',
        wilaya: selectedClient?.wilaya || '',
        payment_method: paymentMethod,
        notes,
        items: items.map((i) => {
          const netPrice = i.unitPrice * (1 - (i.discountPercent || 0) / 100);
          return {
            product_id: i.productId,
            product_name: i.productName,
            reference: i.sku,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            discount_percent: i.discountPercent || 0,
            subtotal: i.quantity * netPrice,
          };
        }),
      };

      const newOrder = await ordersService.create(payload);
      toast.success(`Commande "${newOrder.order_code || 'créée'}" enregistrée avec succès !`);
      router.push('/orders');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Échec de l'enregistrement de la nouvelle commande.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="p-12 flex flex-col items-center justify-center gap-3 border border-border/60 rounded-2xl bg-card">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement du répertoire clients et produits...</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Action Toolbar Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/orders" title="Retour aux commandes">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-3 text-xs font-semibold gap-1.5 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour aux commandes</span>
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
            <span>Réinitialiser</span>
          </Button>

          <Button
            type="submit"
            disabled={submitting || !selectedClientId}
            size="sm"
            className="gap-2 rounded-full h-9 px-5 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Enregistrer la commande ({formatCurrency(totalAmount)})</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Client Selection */}
          <Card className="border-border/60 shadow-xs rounded-2xl bg-card pt-0 gap-0 relative z-30">
            <CardHeader className="bg-muted/30 p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">1. Client Bénéficiaire & Territoire</CardTitle>
                  <CardDescription className="text-xs">
                    Sélectionnez le client pour l&apos;attribution de la commande et la distribution régionale.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Territory / Commercial Region Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" /> Territoire Commercial (Région)
                  </span>
                  {isRegionLocked && (
                    <Badge variant="outline" className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border-amber-500/30">
                      Restriction Territoriale Active
                    </Badge>
                  )}
                </label>

                {isRegionLocked ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/40 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-bold text-foreground">{lockedRegionName}</span>
                      <span className="text-[11px] text-muted-foreground">(Limité à votre territoire commercial assigné)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                      {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} disponible{filteredClients.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ) : (
                  <Select value={selectedRegion} onValueChange={handleRegionChange}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder="Tous les territoires / Régions">
                        {selectedRegion === 'all'
                          ? '🌐 Tous les Territoires / Régions'
                          : `📍 Région ${selectedRegion}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      <SelectItem value="all" className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                        🌐 Tous les Territoires / Régions ({clients.length} clients)
                      </SelectItem>
                      {availableRegions.map((reg) => {
                        const count = clients.filter(
                          (c) => (c.region || '').toLowerCase().trim() === reg.toLowerCase().trim()
                        ).length;
                        return (
                          <SelectItem key={reg} value={reg} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                            📍 Région {reg} ({count} client{count > 1 ? 's' : ''})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Target Client Search & Select with Autofill */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Client Cible <span className="text-primary">*</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} dans le territoire sélectionné
                  </span>
                </label>

                {filteredClients.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Aucun client enregistré dans la région {isRegionLocked ? lockedRegionName : selectedRegion}.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Créez un client pour ce territoire ou sélectionnez une autre région.
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-3">
                    {/* Search Input Field with Select */}
                    <div ref={clientSearchInputRef} className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Rechercher par nom, code (CL-...), wilaya, téléphone..."
                        value={isSearchOpen ? clientSearchQuery : (selectedClient ? `${selectedClient.name} (${selectedClient.wilaya || selectedClient.region || 'Client'})` : clientSearchQuery)}
                        onFocus={() => {
                          setIsSearchOpen(true);
                          setClientSearchQuery('');
                        }}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          if (!isSearchOpen) setIsSearchOpen(true);
                        }}
                        className="h-10 pl-10 pr-9 text-xs sm:text-sm bg-background border-border/70 rounded-xl focus-visible:ring-primary/20 shadow-2xs font-medium"
                      />
                      {(clientSearchQuery || selectedClientId) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isSearchOpen && clientSearchQuery) {
                              setClientSearchQuery('');
                            } else {
                              handleSelectClient(null);
                              setIsSearchOpen(true);
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                          title="Effacer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Portaled Autocomplete / Search Dropdown List - rendered in document.body above parent component */}
                    {mounted && isSearchOpen && dropdownCoords && createPortal(
                      <div
                        ref={dropdownRef}
                        style={{
                          position: 'fixed',
                          top: dropdownCoords.top !== undefined ? `${dropdownCoords.top}px` : undefined,
                          bottom: dropdownCoords.bottom !== undefined ? `${dropdownCoords.bottom}px` : undefined,
                          left: `${dropdownCoords.left}px`,
                          width: `${dropdownCoords.width}px`,
                          maxHeight: `${dropdownCoords.maxHeight}px`,
                        }}
                        className="z-[99999] overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-md divide-y divide-border/20 animate-in fade-in-0 zoom-in-95 duration-100"
                      >
                        {searchedClients.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            Aucun client correspondant à &laquo; {clientSearchQuery} &raquo;.
                          </div>
                        ) : (
                          searchedClients.map((c) => {
                            const isSelected = String(c.id) === String(selectedClientId);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectClient(c)}
                                className={cn(
                                  "w-full text-left p-2.5 px-3 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer",
                                  isSelected
                                    ? "bg-primary/10 text-primary font-bold shadow-2xs"
                                    : "hover:bg-accent/60 text-foreground"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-foreground text-xs sm:text-sm">{c.name}</span>
                                    {c.clientCode && (
                                      <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 bg-muted/40 border-border/60">
                                        {c.clientCode}
                                      </Badge>
                                    )}
                                    {c.clientType && (
                                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                        • {c.clientType}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                    {c.wilaya && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-primary/70" />
                                        {c.wilaya}
                                      </span>
                                    )}
                                    {c.region && (
                                      <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3 text-emerald-500/70" />
                                        {c.region}
                                      </span>
                                    )}
                                    {c.phone && (
                                      <span className="flex items-center gap-1 font-mono text-[10px]">
                                        <Phone className="h-3 w-3 text-blue-500/70" />
                                        {c.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <div className="flex items-center gap-1.5 text-primary">
                                    <Check className="h-4 w-4" />
                                    <span className="text-[11px] font-bold hidden sm:inline">Sélectionné</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground font-semibold shrink-0">
                                    Choisir
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>,
                      document.body
                    )}

                    {/* Selected Client Summary Card with Autofill Indicators */}
                    {selectedClient ? (
                      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                              {selectedClient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-foreground">{selectedClient.name}</h4>
                                {selectedClient.clientCode && (
                                  <Badge variant="outline" className="text-[10px] font-mono bg-background text-primary border-primary/30">
                                    {selectedClient.clientCode}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {selectedClient.phone || 'Aucun numéro renseigné'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Pré-remplissage actif</span>
                            </Badge>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsSearchOpen(true);
                                setClientSearchQuery('');
                              }}
                              className="h-7 text-xs px-2.5 rounded-lg border-border/80 hover:bg-muted"
                            >
                              Changer
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-primary/15 text-[11px] text-muted-foreground">
                          <div>
                            Wilaya : <strong className="text-foreground">{selectedClient.wilaya || '—'}</strong>
                          </div>
                          <div>
                            Région : <strong className="text-foreground">{selectedClient.region || '—'}</strong>
                          </div>
                          <div className="truncate">
                            Délégué : <strong className="text-foreground">{selectedClient.delegateName || 'Délégué Commercial'}</strong>
                          </div>
                        </div>

                        {selectedClient.address && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Adresse auto-assignée : <strong className="text-foreground">{selectedClient.address}</strong></span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                        Cliquez sur la barre de recherche pour sélectionner un client bénéficiaire.
                      </div>
                    )}
                  </div>
                )}

                {errors.client && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.client}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Ordered Items & Quantities */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-muted/30 p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">2. Articles Commandés & Quantités</CardTitle>
                    <CardDescription className="text-xs">
                      Ajoutez des produits, ajustez les quantités et définissez le prix unitaire.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-9 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-border/70 hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Ajouter une ligne</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl border border-border/60 overflow-hidden bg-background shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border/40">
                    <tr>
                      <th className="text-left font-bold text-muted-foreground px-4 py-3">Nom du produit</th>
                      <th className="text-center font-bold text-muted-foreground px-3 py-3 w-28">Qté (Unités)</th>
                      <th className="text-right font-bold text-muted-foreground px-3 py-3 w-32">Prix brut (DA)</th>
                      <th className="text-center font-bold text-muted-foreground px-3 py-3 w-36">Réduction / Remise (%)</th>
                      <th className="text-right font-bold text-muted-foreground px-4 py-3 w-36">Sous-total Net</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const netUnitPrice = row.unitPrice * (1 - (row.discountPercent || 0) / 100);
                      const subtotal = row.quantity * netUnitPrice;

                      return (
                        <tr key={row.id} className="border-t border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <Select
                              value={row.productId}
                              onValueChange={(val) => val && handleProductChange(row.id, val)}
                            >
                              <SelectTrigger className="w-full h-11 text-xs font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20">
                                <SelectValue placeholder="Choisir un produit...">
                                  <div className="flex items-center gap-2 text-left truncate">
                                    <span className="font-bold text-foreground truncate">{row.productName}</span>
                                    {row.sku && (
                                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/60 border-border/60 shrink-0">
                                        {row.sku}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border/60 p-1 max-h-64 z-[120]">
                                {products.map((p) => {
                                  const basePrice = Number(p.sellingPrice || p.nominalPrice || p.price || 0);
                                  return (
                                    <SelectItem key={p.id} value={p.id} className="text-xs font-medium py-2.5 cursor-pointer">
                                      <div className="flex items-center justify-between gap-3 w-full">
                                        <div>
                                          <div className="font-bold text-foreground text-xs">{p.name}</div>
                                          <div className="text-[10px] text-muted-foreground font-mono">
                                            SKU: {p.sku || p.code || 'N/A'} {p.category ? `• ${p.category}` : ''}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-primary font-bold">{formatCurrency(basePrice)}</span>
                                          {p.discountPercent ? (
                                            <span className="block text-[10px] text-emerald-600 font-semibold">
                                              -{p.discountPercent}% suggéré
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(row.id, Number(e.target.value))}
                              className="h-10 text-xs text-center font-bold rounded-xl border-border/70 bg-background focus:border-primary"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="10"
                              value={row.unitPrice}
                              onChange={(e) => handleUnitPriceChange(row.id, Number(e.target.value))}
                              className="h-10 text-xs text-right font-semibold rounded-xl border-border/70 bg-background focus:border-primary"
                            />
                            {row.discountPercent > 0 && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-right">
                                Net: {formatCurrency(netUnitPrice)}
                              </div>
                            )}
                          </td>

                          {/* Price Reducer / Discount % */}
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <div className="relative w-24">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={row.discountPercent === 0 ? '' : row.discountPercent}
                                  placeholder="0%"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                    handleDiscountChange(row.id, val);
                                  }}
                                  className="h-9 text-xs text-center font-bold rounded-xl border-border/70 bg-background focus:border-primary pr-6"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground pointer-events-none">
                                  %
                                </span>
                              </div>
                              {/* Quick Presets: 2%, 3.5%, 5% */}
                              <div className="flex items-center gap-1">
                                {[2, 3.5, 5].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleDiscountChange(row.id, preset)}
                                    className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer border",
                                      row.discountPercent === preset
                                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                                    )}
                                    title={`Appliquer -${preset}%`}
                                  >
                                    {preset}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            <div>
                              <span className="text-xs font-bold text-foreground">
                                {formatCurrency(subtotal)}
                              </span>
                              {row.discountPercent > 0 && (
                                <div className="text-[10px] text-muted-foreground line-through">
                                  {formatCurrency(row.quantity * row.unitPrice)}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRow(row.id)}
                              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/40 border-t border-border/40">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-bold text-muted-foreground">
                        Total articles : <strong className="text-foreground font-extrabold">{totalQuantity} unité{totalQuantity > 1 ? 's' : ''}</strong>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-muted-foreground">
                        Montant Net Total :
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary text-base">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Delivery Address & Notes */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-muted/30 p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">3. Adresse de Livraison & Instructions Particulières</CardTitle>
                  <CardDescription className="text-xs">
                    Indiquez l&apos;adresse exacte de livraison et les instructions de traitement spécifiques.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="address" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Adresse de livraison
                  </label>
                  <Input
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="ex. Zone Industrielle, Route N5, Alger"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" /> Instructions particulières
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Créneau de livraison, personne de contact, consignes urgentes..."
                    rows={2}
                    className="text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Profile Card Sidebar (4 cols sticky) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 gap-0">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Résumé en direct</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Aperçu
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Header Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                  {selectedClient ? selectedClient.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      ORD-NOUVELLE
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5">
                      En attente
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1">
                    {selectedClient ? selectedClient.name : 'Sélectionner un client'}
                  </h3>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Detail List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Région :
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-border/70 text-foreground bg-muted/30">
                    {selectedClient ? selectedClient.region : '—'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya :
                  </span>
                  <span className="font-semibold text-foreground">{selectedClient ? selectedClient.wilaya : '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Délégué Commercial :
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">
                    {selectedClient ? (selectedClient.delegateName || 'Délégué Commercial') : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary" /> Total Unités :
                  </span>
                  <span className="font-bold text-foreground">{totalQuantity} unité{totalQuantity > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Total Revenue Box */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Chiffre d&apos;Affaires Total</span>
                  <span className="text-lg font-extrabold text-primary tracking-tight">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <DollarSign className="h-6 w-6 text-primary opacity-60" />
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
                Effacer le formulaire
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={submitting || !selectedClientId}
                className="gap-2 rounded-xl h-8 px-4 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" /> : <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                <span>Enregistrer la commande</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
