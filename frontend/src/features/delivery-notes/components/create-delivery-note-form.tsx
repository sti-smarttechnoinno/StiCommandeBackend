'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Truck,
  Plus,
  Trash2,
  Loader2,
  FileText,
  ShoppingBag,
  User,
  MapPin,
  CheckCircle2,
  Layers,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Check,
  Globe,
  UserCheck,
  Package,
  RotateCcw,
  Search,
  Gift,
  Percent,
  MessageSquare,
  X,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ordersService, type OrderData } from '@/services/orders';
import { clientsService, type ClientData } from '@/services/clients';
import { productsService, type ProductData } from '@/services/products';
import { regionsService } from '@/services/regions';
import { wilayasService } from '@/services/wilayas';
import { deliveryNotesService } from '@/services/delivery-notes';
import { usePermissions } from '@/hooks/use-permissions';
import type { CreateDeliveryNotePayload } from '../types';

interface OrderItemRowState {
  orderItemId: string;
  productId?: number;
  productName: string;
  reference?: string;
  orderedQty: number;
  alreadyDeliveredQty: number;
  remainingQty: number;
  quantityToDeliver: number;
  unitPrice: number;
  discountPercent: number;
  isGift: boolean;
  notes: string;
  included: boolean;
}

interface DirectItemRowState {
  id: string;
  productId?: number;
  productName: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  isGift: boolean;
  notes: string;
}

interface ProductSearchSelectorProps {
  products: ProductData[];
  selectedProductId?: number;
  selectedProductName: string;
  selectedReference?: string;
  onSelectProduct: (product: { id?: number; name: string; reference?: string; price: number }) => void;
}

function ProductSearchSelector({
  products,
  selectedProductId,
  selectedProductName,
  selectedReference,
  onSelectProduct,
}: ProductSearchSelectorProps) {
  const [isSearching, setIsSearching] = useState(!selectedProductName && !selectedProductId);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search mode on outside click if article is already selected
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (selectedProductName || selectedProductId) {
          setIsSearching(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedProductName, selectedProductId]);

  // Focus input on search mode activation
  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products.slice(0, 15);
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || p.code || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || cat.includes(q);
    });
  }, [products, searchQuery]);

  // Catalogue product match
  const matchedProduct = useMemo(() => {
    if (selectedProductId) {
      return products.find((p) => Number(p.id) === Number(selectedProductId));
    }
    if (selectedProductName) {
      return products.find((p) => p.name.toLowerCase() === selectedProductName.toLowerCase());
    }
    return undefined;
  }, [products, selectedProductId, selectedProductName]);

  // Selected Article View (Wide, Prominent, Clear Name)
  if (!isSearching && (selectedProductName || selectedProductId)) {
    return (
      <div className="w-full p-3 px-4 rounded-xl bg-background border border-primary/30 flex items-center justify-between gap-3 shadow-2xs group hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {selectedProductName || matchedProduct?.name || 'Article sans nom'}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
              {(selectedReference || matchedProduct?.sku || matchedProduct?.code) && (
                <span className="font-mono bg-muted/70 px-1.5 py-0.5 rounded text-[10px] text-foreground font-semibold">
                  Réf: {selectedReference || matchedProduct?.sku || matchedProduct?.code}
                </span>
              )}
              {matchedProduct && (
                <span>
                  • Prix catalogue: <strong className="text-foreground">{Number(matchedProduct.sellingPrice || matchedProduct.price || 0).toLocaleString()} DA</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsSearching(true);
            setSearchQuery('');
          }}
          className="h-8 text-xs font-semibold gap-1.5 px-3 rounded-lg border-primary/30 text-primary hover:bg-primary/5 shrink-0 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Changer</span>
        </Button>
      </div>
    );
  }

  // Search View (Full Width Autocomplete)
  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher par nom de médicament / article, référence, code catalogue..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10 text-xs bg-background rounded-xl border-primary/40 focus-visible:ring-primary/20 shadow-2xs w-full"
        />
        {(selectedProductName || selectedProductId) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            title="Annuler"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Live Dropdown Results */}
      <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 shadow-lg divide-y divide-border/30">
        {filteredProducts.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Aucun article trouvé pour &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <button
              key={prod.id}
              type="button"
              onClick={() => {
                onSelectProduct({
                  id: prod.id ? Number(prod.id) : undefined,
                  name: prod.name,
                  reference: prod.sku || prod.code || '',
                  price: Number(prod.sellingPrice || prod.price || 0),
                });
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="w-full text-left p-2.5 px-3 hover:bg-accent/60 rounded-lg transition-colors flex items-center justify-between gap-3 group text-xs cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                  {prod.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {prod.sku || prod.code ? `Réf: ${prod.sku || prod.code}` : ''}
                  {prod.category ? ` • ${prod.category}` : ''}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-semibold text-primary block">
                  {Number(prod.sellingPrice || prod.price || 0).toLocaleString()} DA
                </span>
                <Badge variant="outline" className="text-[9px] font-bold py-0 px-1 border-border/60 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary">
                  Sélectionner
                </Badge>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const STATUS_OPTIONS: Record<'in_transit' | 'delivered' | 'pending', { label: string; desc: string }> = {
  in_transit: {
    label: "En cours d'acheminement (En transit)",
    desc: 'Marchandise en cours de transport vers le client',
  },
  delivered: {
    label: 'Livré (Remis directement au client)',
    desc: 'Colis réceptionné et acquitté par le destinataire',
  },
  pending: {
    label: "En attente d'expédition",
    desc: 'En cours de préparation dans les locaux logistiques',
  },
};

interface SearchableSelectDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; subtext?: string }[];
  placeholder: string;
  disabled?: boolean;
  disabledBadge?: string;
  required?: boolean;
}

function SearchableSelectDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  disabledBadge,
  required,
}: SearchableSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtext && o.subtext.toLowerCase().includes(q)) ||
        o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  if (disabled) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground block font-medium">
            {label} {required && '*'}
          </label>
          {disabledBadge && (
            <Badge variant="outline" className="text-[9px] text-muted-foreground bg-muted/40 border-border/50 py-0">
              {disabledBadge}
            </Badge>
          )}
        </div>
        <div className="relative">
          <Input
            value={value || '—'}
            disabled
            readOnly
            className="h-10 text-xs bg-muted/40 font-semibold text-foreground border-border/60 cursor-not-allowed pl-8"
          />
          <Lock className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground block font-medium">
          {label} {required && '*'}
        </label>
        <Badge variant="outline" className="text-[9px] text-primary bg-primary/5 border-primary/20 py-0">
          Admin: Modifiable
        </Badge>
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={open ? search : value || ''}
          onFocus={() => {
            setOpen(true);
            setSearch(value || '');
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          className="h-10 text-xs bg-background pl-8 pr-8 border-border/70 rounded-lg focus-visible:ring-primary/20 font-medium"
        />
        <MapPin className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        {value && !open && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSearch('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-52 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 shadow-lg divide-y divide-border/30">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Aucun résultat pour &quot;{search}&quot;.
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(search.trim());
                    setOpen(false);
                  }}
                  className="block w-full mt-1.5 text-primary text-xs font-semibold hover:underline cursor-pointer"
                >
                  Utiliser &quot;{search.trim()}&quot;
                </button>
              )}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left p-2 px-3 hover:bg-accent/60 rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer ${
                  opt.value === value ? 'bg-primary/10 text-primary font-bold' : 'text-foreground'
                }`}
              >
                <div>
                  <span className="block">{opt.label}</span>
                  {opt.subtext && (
                    <span className="text-[10px] text-muted-foreground">{opt.subtext}</span>
                  )}
                </div>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CreateDeliveryNoteForm() {
  const router = useRouter();
  const { user, isAdmin, isCommercial, isRestrictedByRegion, region: userRegion } = usePermissions();

  const [activeTab, setActiveTab] = useState<'from_order' | 'direct'>('direct');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reference lists
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [dbRegions, setDbRegions] = useState<string[]>([]);
  const [dbWilayas, setDbWilayas] = useState<{ code: string; name: string; region_name: string }[]>([]);

  // Client Search & Selection
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Mode 1: From Order
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItemRowState[]>([]);

  // Mode 2: Direct
  const [directItems, setDirectItems] = useState<DirectItemRowState[]>([]);

  // Destination & Logistics
  const [region, setRegion] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [delegateId, setDelegateId] = useState<number | undefined>();
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState<number | undefined>();
  const [status, setStatus] = useState<'in_transit' | 'delivered' | 'pending'>('in_transit');
  const [generalNotes, setGeneralNotes] = useState('');

  // Initial load
  useEffect(() => {
    let isMounted = true;
    setLoadingData(true);

    Promise.all([
      ordersService.list({ pageSize: 100 }),
      clientsService.list({ pageSize: 250 }),
      productsService.list({ pageSize: 200 }),
      regionsService.list().catch(() => ({ data: [] })),
      wilayasService.list({ pageSize: 150 }).catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, clientsRes, productsRes, regionsRes, wilayasRes]) => {
        if (!isMounted) return;

        const allOrders = ordersRes.data || [];
        const allClients = clientsRes.data || [];
        const allProducts = productsRes.data || [];

        // Build DB regions list
        const regList: string[] = [];
        ((regionsRes as any).data || []).forEach((r: any) => {
          if (r.name && !regList.includes(r.name)) regList.push(r.name);
        });

        // Build DB wilayas list
        const wList: { code: string; name: string; region_name: string }[] = [];
        ((wilayasRes as any).data || []).forEach((w: any) => {
          const rName = w.region_name || w.region || '';
          if (rName && !regList.includes(rName)) regList.push(rName);
          wList.push({
            code: w.code || '',
            name: w.name || '',
            region_name: rName,
          });
        });

        // Ensure primary Algerian regions are always present in the list
        ['Centre Est', 'Centre', 'Est', 'Ouest', 'Sud'].forEach((r) => {
          if (!regList.includes(r)) regList.push(r);
        });

        setDbRegions(regList);
        setDbWilayas(wList);

        const defaultRegion = userRegion || user?.region || 'Centre Est';
        setRegion((prev) => prev || defaultRegion);

        const effectiveRegion = (isCommercial || isRestrictedByRegion) && (userRegion || user?.region)
          ? (userRegion || user?.region || '').toLowerCase().trim()
          : '';

        const filteredOrders = effectiveRegion
          ? allOrders.filter((o) => (o.region || '').toLowerCase().trim() === effectiveRegion)
          : allOrders;

        const filteredClients = effectiveRegion
          ? allClients.filter((c) => (c.region || '').toLowerCase().trim() === effectiveRegion)
          : allClients;

        setOrders(filteredOrders);
        setClients(filteredClients);
        setProducts(allProducts);

        if (allProducts.length > 0 && directItems.length === 0) {
          const firstP = allProducts[0];
          setDirectItems([
            {
              id: 'item-1',
              productId: firstP.id ? Number(firstP.id) : undefined,
              productName: firstP.name,
              reference: firstP.sku || firstP.code || '',
              quantity: 1,
              unitPrice: Number(firstP.sellingPrice || firstP.price || 0),
              discountPercent: 0,
              isGift: false,
              notes: '',
            },
          ]);
        }
      })
      .catch(() => {
        toast.error('Erreur lors du chargement des données.');
      })
      .finally(() => {
        if (isMounted) setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCommercial, isRestrictedByRegion, userRegion, user?.region]);

  // Filtered clients list based on search term
  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.wilaya || '').toLowerCase().includes(q) ||
        (c.clientCode || '').toLowerCase().includes(q) ||
        (c.region || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  // Filter eligible orders: exclude cancelled, delivered, or orders that already generated BLs
  const eligibleOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Exclude cancelled and delivered orders
      if (o.status === 'cancelled' || o.status === 'delivered') return false;

      // 2. Exclude orders that already have delivery notes created previously
      const dnList = o.deliveryNotes || o.delivery_notes || [];
      if (dnList.length > 0) {
        const items = o.items || [];
        const totalOrdered = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        const totalInBL = dnList.reduce((sum, dn) => sum + (Number(dn.total_quantity || dn.totalQuantity) || 0), 0);

        // If order was validated and already has a BL created, or if all ordered quantity is already dispatched
        if (o.status === 'validated' || (totalOrdered > 0 && totalInBL >= totalOrdered)) {
          return false;
        }
      }

      return true;
    });
  }, [orders]);

  // Filtered orders list based on search term & eligible orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim();
    if (!q) return eligibleOrders;
    return eligibleOrders.filter(
      (o) =>
        (o.order_code || '').toLowerCase().includes(q) ||
        (o.client_name || '').toLowerCase().includes(q) ||
        (o.wilaya || '').toLowerCase().includes(q) ||
        (o.region || '').toLowerCase().includes(q)
    );
  }, [eligibleOrders, orderSearch]);

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => String(c.id) === selectedClientId);
  }, [clients, selectedClientId]);

  // Selected order object
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  // Region options from DB
  const regionOptions = useMemo(() => {
    return dbRegions.map((r) => ({
      label: r,
      value: r,
    }));
  }, [dbRegions]);

  // Wilaya options from DB (scoped to selected region if set)
  const wilayaOptions = useMemo(() => {
    const currentReg = (region || userRegion || user?.region || '').toLowerCase().trim();
    const filtered = currentReg
      ? dbWilayas.filter((w) => (w.region_name || '').toLowerCase().trim() === currentReg)
      : dbWilayas;
    const list = filtered.length > 0 ? filtered : dbWilayas;

    return list.map((w) => ({
      label: `${w.code ? w.code + ' - ' : ''}${w.name}`,
      value: w.name,
      subtext: w.region_name ? `Région: ${w.region_name}` : undefined,
    }));
  }, [dbWilayas, region, userRegion, user?.region]);

  // Client Selection Handler
  const handleSelectClient = (c: ClientData) => {
    setSelectedClientId(String(c.id));
    setClientName(c.name);
    setClientId(c.id ? Number(c.id) : undefined);
    setRegion(c.region || userRegion || user?.region || 'Centre Est');
    setWilaya(c.wilaya || '');
    setDeliveryAddress(c.address || '');
    setDelegateName(c.delegateName || user?.name || '');
    setDelegateId(c.delegateId ? Number(c.delegateId) : (user?.id ? Number(user.id) : undefined));
    setClientSearch('');
  };

  // Order Selection Handler
  const handleSelectOrder = async (orderId: string | null) => {
    const oId = orderId || '';
    setSelectedOrderId(oId);
    if (!oId) {
      setOrderItems([]);
      return;
    }

    const order = orders.find((o) => o.id === oId);
    if (!order) return;

    setClientName(order.client_name);
    setClientId(order.client_id ? Number(order.client_id) : undefined);
    setDelegateName(order.delegate_name || user?.name || '');
    setDelegateId(order.delegate_id ? Number(order.delegate_id) : (user?.id ? Number(user.id) : undefined));
    setRegion(order.region || userRegion || user?.region || 'Centre Est');
    setWilaya(order.wilaya || '');
    setDeliveryAddress(order.delivery_address || '');

    try {
      const fullOrder = await ordersService.get(oId);
      const items = fullOrder.items || order.items || [];

      const mappedItems: OrderItemRowState[] = items.map((it) => {
        const ordered = Number(it.quantity) || 0;
        const delivered = Number(it.validated_quantity) || 0;
        const remaining = Math.max(0, ordered - delivered);
        const qtyToDeliver = remaining > 0 ? remaining : ordered;

        return {
          orderItemId: it.id || '',
          productId: it.product_id ? Number(it.product_id) : undefined,
          productName: it.product_name,
          reference: it.reference,
          orderedQty: ordered,
          alreadyDeliveredQty: delivered,
          remainingQty: remaining,
          quantityToDeliver: qtyToDeliver,
          unitPrice: Number(it.unit_price) || 0,
          discountPercent: 0,
          isGift: false,
          notes: '',
          included: remaining > 0,
        };
      });

      setOrderItems(mappedItems);
    } catch {
      const items = order.items || [];
      const mappedItems: OrderItemRowState[] = items.map((it) => {
        const ordered = Number(it.quantity) || 0;
        const delivered = Number(it.validated_quantity) || 0;
        const remaining = Math.max(0, ordered - delivered);

        return {
          orderItemId: it.id || '',
          productId: it.product_id ? Number(it.product_id) : undefined,
          productName: it.product_name,
          reference: it.reference,
          orderedQty: ordered,
          alreadyDeliveredQty: delivered,
          remainingQty: remaining,
          quantityToDeliver: remaining > 0 ? remaining : ordered,
          unitPrice: Number(it.unit_price) || 0,
          discountPercent: 0,
          isGift: false,
          notes: '',
          included: remaining > 0,
        };
      });
      setOrderItems(mappedItems);
    }
  };

  // Direct Mode item operations
  const handleAddDirectItem = () => {
    setDirectItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: undefined,
        productName: '',
        reference: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        isGift: false,
        notes: '',
      },
    ]);
  };

  const handleRemoveDirectItem = (index: number) => {
    if (directItems.length <= 1) {
      toast.warning('Un bon de livraison doit comporter au moins 1 article.');
      return;
    }
    setDirectItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDirectProductSelect = (
    index: number,
    p: { id?: number; name: string; reference?: string; price: number }
  ) => {
    setDirectItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          productId: p.id,
          productName: p.name,
          reference: p.reference || '',
          unitPrice: p.price > 0 ? p.price : row.unitPrice,
        };
      })
    );
  };

  const handleDirectItemQtyChange = (index: number, val: number) => {
    setDirectItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity: Math.max(1, val) } : row))
    );
  };

  const handleDirectItemPriceChange = (index: number, val: number) => {
    setDirectItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, unitPrice: Math.max(0, val) } : row))
    );
  };

  const handleDirectItemDiscountChange = (index: number, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    setDirectItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, discountPercent: clamped } : row))
    );
  };

  const handleDirectItemToggleGift = (index: number) => {
    setDirectItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const newGiftState = !row.isGift;
        return {
          ...row,
          isGift: newGiftState,
          notes: newGiftState && !row.notes ? 'Cadeau / Offert' : row.notes,
        };
      })
    );
  };

  const handleDirectItemNotesChange = (index: number, notes: string) => {
    setDirectItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, notes } : row))
    );
  };

  // Order Items update
  const handleOrderItemCheckChange = (index: number, checked: boolean) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, included: checked } : item))
    );
  };

  const handleOrderItemQtyChange = (index: number, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantityToDeliver: Math.max(1, Math.min(item.remainingQty > 0 ? item.remainingQty : 9999, qty)),
            }
          : item
      )
    );
  };

  const handleOrderItemDiscountChange = (index: number, percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent));
    setOrderItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, discountPercent: clamped } : row))
    );
  };

  const handleOrderItemToggleGift = (index: number) => {
    setOrderItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const newGiftState = !row.isGift;
        return {
          ...row,
          isGift: newGiftState,
          notes: newGiftState && !row.notes ? 'Cadeau / Offert' : row.notes,
        };
      })
    );
  };

  const handleOrderItemNotesChange = (index: number, notes: string) => {
    setOrderItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, notes } : row))
    );
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    if (activeTab === 'from_order') {
      const activeItems = orderItems.filter((i) => i.included && i.quantityToDeliver > 0);
      let totalQty = 0;
      let totalAmount = 0;
      let totalGifts = 0;

      activeItems.forEach((i) => {
        totalQty += i.quantityToDeliver;
        if (i.isGift) {
          totalGifts += i.quantityToDeliver;
        } else {
          const netPrice = i.unitPrice * (1 - (i.discountPercent || 0) / 100);
          totalAmount += i.quantityToDeliver * netPrice;
        }
      });

      const allOrderItemsDelivered = orderItems.length > 0 && orderItems.every((i) => {
        if (!i.included) return i.remainingQty === 0;
        return i.quantityToDeliver >= i.remainingQty;
      });

      return {
        totalQty,
        totalAmount: Math.round(totalAmount),
        itemsCount: activeItems.length,
        totalGifts,
        isFull: allOrderItemsDelivered,
      };
    } else {
      const activeItems = directItems.filter((i) => i.quantity > 0 && i.productName);
      let totalQty = 0;
      let totalAmount = 0;
      let totalGifts = 0;

      activeItems.forEach((i) => {
        totalQty += i.quantity;
        if (i.isGift) {
          totalGifts += i.quantity;
        } else {
          const netPrice = i.unitPrice * (1 - (i.discountPercent || 0) / 100);
          totalAmount += i.quantity * netPrice;
        }
      });

      return {
        totalQty,
        totalAmount: Math.round(totalAmount),
        itemsCount: activeItems.length,
        totalGifts,
        isFull: true,
      };
    }
  }, [activeTab, orderItems, directItems]);

  const handleResetForm = () => {
    setSelectedOrderId('');
    setOrderItems([]);
    setSelectedClientId('');
    setClientName('');
    setClientId(undefined);
    setRegion('');
    setWilaya('');
    setDeliveryAddress('');
    setDelegateName('');
    setDelegateId(undefined);
    setGeneralNotes('');
    setStatus('in_transit');
    if (products.length > 0) {
      const p = products[0];
      setDirectItems([
        {
          id: `item-${Date.now()}`,
          productId: p.id ? Number(p.id) : undefined,
          productName: p.name,
          reference: p.sku || p.code || '',
          quantity: 1,
          unitPrice: Number(p.sellingPrice || p.price || 0),
          discountPercent: 0,
          isGift: false,
          notes: '',
        },
      ]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error('Veuillez sélectionner le client destinataire.');
      return;
    }

    if (!region.trim() || !wilaya.trim()) {
      toast.error('La région et la wilaya sont obligatoires.');
      return;
    }

    if (calculatedTotals.itemsCount === 0) {
      toast.error('Veuillez inclure au moins un article dans ce bon de livraison.');
      return;
    }

    if (activeTab === 'direct' && directItems.some((i) => !i.productName.trim())) {
      toast.error("Veuillez sélectionner un article valide pour chaque ligne d'expédition.");
      return;
    }

    setSubmitting(true);

    try {
      let payload: CreateDeliveryNotePayload;

      if (activeTab === 'from_order') {
        const order = orders.find((o) => o.id === selectedOrderId);
        const includedItems = orderItems.filter((i) => i.included && i.quantityToDeliver > 0);

        payload = {
          order_id: selectedOrderId || undefined,
          order_code: order?.order_code,
          client_id: clientId,
          client_name: clientName,
          delegate_id: delegateId,
          delegate_name: delegateName,
          region,
          wilaya,
          delivery_address: deliveryAddress,
          status,
          validation_type: calculatedTotals.isFull ? 'full' : 'partial',
          notes: generalNotes,
          items: includedItems.map((i) => ({
            order_item_id: i.orderItemId || undefined,
            product_id: i.productId,
            product_name: i.productName,
            reference: i.reference,
            quantity: i.quantityToDeliver,
            unit_price: i.unitPrice,
            discount_percent: i.discountPercent,
            is_gift: i.isGift,
            notes: i.notes || undefined,
          })),
        };
      } else {
        payload = {
          order_code: 'DIRECT',
          client_id: clientId,
          client_name: clientName,
          delegate_id: delegateId,
          delegate_name: delegateName,
          region,
          wilaya,
          delivery_address: deliveryAddress,
          status,
          validation_type: 'full',
          notes: generalNotes,
          items: directItems.map((i) => ({
            product_id: i.productId,
            product_name: i.productName,
            reference: i.reference,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            discount_percent: i.discountPercent,
            is_gift: i.isGift,
            notes: i.notes || undefined,
          })),
        };
      }

      const res = await deliveryNotesService.create(payload);
      toast.success(`Bon de livraison ${res.delivery_note_code} créé avec succès !`);
      router.push('/delivery-notes');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la création du bon de livraison.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Chargement des clients, commandes et catalogue produits...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Form Inputs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Mode Selection & Client / Commande */}
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      1. Client Destinataire &amp; Type d&apos;Émission
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Sélectionnez un client existant ou rattachez le bon à une commande en cours.
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab((val || 'direct') as 'from_order' | 'direct')}
                className="w-full"
              >
                <TabsList className="flex items-center gap-3 w-full max-w-xl p-1.5 bg-muted/60 rounded-2xl mb-6">
                  <TabsTrigger
                    value="direct"
                    className="flex-1 rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border/60 flex items-center justify-center gap-2.5 py-2.5 px-4 transition-all duration-200 cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Création directe (Hors commande)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="from_order"
                    className="flex-1 rounded-xl text-xs font-bold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border/60 flex items-center justify-center gap-2.5 py-2.5 px-4 transition-all duration-200 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>À partir d&apos;une commande</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: DIRECT MODE (CLIENT SELECTOR WITH SEARCH & NAME DISPLAY) */}
                <TabsContent value="direct" className="space-y-4 mt-0">
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Client Destinataire *
                    </label>

                    {/* Selected Client Card if chosen */}
                    {selectedClient ? (
                      <div className="p-3.5 rounded-xl bg-card border border-primary/30 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                            {selectedClient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {selectedClient.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedClient.wilaya || selectedClient.region} • {selectedClient.phone || 'Pas de tél'}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClientId('');
                            setClientName('');
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2.5 rounded-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Changer</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Search input for client */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Rechercher par nom de client, wilaya, code client..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-9 h-10 text-xs bg-background rounded-lg border-border/70"
                          />
                        </div>

                        {/* Search results list */}
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-background divide-y divide-border/40 shadow-xs">
                          {filteredClients.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              Aucun client trouvé pour &quot;{clientSearch}&quot;.
                            </div>
                          ) : (
                            filteredClients.slice(0, 8).map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectClient(c)}
                                className="w-full text-left p-2.5 px-3.5 hover:bg-muted/60 transition-colors flex items-center justify-between group text-xs cursor-pointer"
                              >
                                <div>
                                  <span className="font-bold text-foreground group-hover:text-primary transition-colors block">
                                    {c.name}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {c.wilaya ? `${c.wilaya} (${c.region})` : c.region || 'Région non définie'}
                                    {c.clientCode ? ` • Réf: ${c.clientCode}` : ''}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground group-hover:border-primary/40 group-hover:text-primary">
                                  Sélectionner
                                </Badge>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: FROM ORDER */}
                <TabsContent value="from_order" className="space-y-4 mt-0">
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Sélectionner une Commande Source *
                    </label>

                    {/* Selected Order Card if chosen */}
                    {selectedOrder ? (
                      <div className="p-3.5 rounded-xl bg-card border border-primary/30 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {selectedOrder.order_code}
                              </h4>
                              <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
                                {Number(selectedOrder.total_amount || 0).toLocaleString()} DA
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Client : <strong className="text-foreground font-medium">{selectedOrder.client_name}</strong>
                              {selectedOrder.wilaya ? ` • ${selectedOrder.wilaya} (${selectedOrder.region})` : ` • ${selectedOrder.region}`}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId('');
                            setOrderItems([]);
                            setClientName('');
                            setClientId(undefined);
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2.5 rounded-lg cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Changer</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Rechercher par N° commande, client, wilaya..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="pl-9 h-10 text-xs bg-background rounded-lg border-border/70"
                          />
                        </div>

                        <Select value={selectedOrderId} onValueChange={handleSelectOrder}>
                          <SelectTrigger className="w-full h-11 bg-background text-xs rounded-lg border-border/70">
                            <SelectValue placeholder="-- Choisir une commande --" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {filteredOrders.length === 0 ? (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                {orderSearch
                                  ? `Aucune commande éligible trouvée pour "${orderSearch}".`
                                  : 'Aucune commande en attente de bon de livraison.'}
                              </div>
                            ) : (
                              filteredOrders.map((o) => (
                                <SelectItem key={o.id} value={o.id}>
                                  <span className="font-bold text-foreground">{o.order_code}</span>
                                  <span className="text-muted-foreground ml-2">— {o.client_name}</span>
                                  <span className="text-xs text-primary font-semibold ml-2">
                                    ({Number(o.total_amount || 0).toLocaleString()} DA)
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Card 2: Articles Table with Quantity, Price, Discount %, Gift Toggle & Comments */}
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      2. Articles à inclure dans l&apos;expédition
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Gérez les volumes, remises en %, cadeaux et ajoutez des commentaires par article.
                    </CardDescription>
                  </div>
                </div>

                {activeTab === 'direct' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddDirectItem}
                    className="gap-1.5 text-xs h-8 rounded-lg font-semibold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter un article</span>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {activeTab === 'from_order' ? (
                /* Order Items Table */
                !selectedOrderId ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Veuillez d&apos;abord sélectionner une commande ci-dessus pour afficher ses articles.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((it, idx) => {
                      const netPrice = it.isGift ? 0 : it.unitPrice * (1 - (it.discountPercent || 0) / 100);
                      const subtotal = it.included ? it.quantityToDeliver * netPrice : 0;

                      return (
                        <div
                          key={it.orderItemId || idx}
                          className={`p-4 rounded-xl border transition-all ${
                            it.included
                              ? 'bg-card border-border/70 shadow-xs'
                              : 'bg-muted/20 border-border/30 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={it.included}
                                onCheckedChange={(checked) =>
                                  handleOrderItemCheckChange(idx, Boolean(checked))
                                }
                              />
                              <div>
                                <span className="font-bold text-xs text-foreground block">
                                  {it.productName}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  Commandé: {it.orderedQty} • Livré: {it.alreadyDeliveredQty} • Restant:{' '}
                                  <strong className="text-amber-600 dark:text-amber-400">
                                    {it.remainingQty}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Gift Badge / Toggle */}
                            <Button
                              type="button"
                              size="sm"
                              variant={it.isGift ? 'default' : 'outline'}
                              onClick={() => handleOrderItemToggleGift(idx)}
                              disabled={!it.included}
                              className={`h-7 text-[11px] gap-1 px-2.5 rounded-lg font-semibold ${
                                it.isGift
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'border-dashed border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                              }`}
                            >
                              <Gift className="h-3 w-3" />
                              <span>{it.isGift ? 'Cadeau / Offert' : 'Marquer Cadeau'}</span>
                            </Button>
                          </div>

                          {/* Controls Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/40 text-xs items-center">
                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Qté à Livrer
                              </label>
                              <Input
                                type="number"
                                min={1}
                                max={it.remainingQty > 0 ? it.remainingQty : undefined}
                                disabled={!it.included}
                                value={it.quantityToDeliver}
                                onChange={(e) =>
                                  handleOrderItemQtyChange(idx, parseInt(e.target.value) || 0)
                                }
                                className="h-8 text-center text-xs font-bold bg-background"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Prix Brut (DA)
                              </label>
                              <span className="text-xs font-mono font-semibold text-muted-foreground block pt-1.5">
                                {it.unitPrice.toLocaleString()} DA
                              </span>
                            </div>

                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Remise (%)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                disabled={!it.included || it.isGift}
                                value={it.discountPercent}
                                onChange={(e) =>
                                  handleOrderItemDiscountChange(idx, parseFloat(e.target.value) || 0)
                                }
                                className="h-8 text-center text-xs font-mono bg-background"
                              />
                            </div>

                            <div className="text-right">
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Sous-total Net
                              </label>
                              <span className="text-xs font-bold font-mono text-foreground block pt-1.5">
                                {it.isGift ? (
                                  <span className="text-purple-600 font-bold">0 DA (Offert)</span>
                                ) : (
                                  `${Math.round(subtotal).toLocaleString()} DA`
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Notes / Comments input for this article */}
                          <div className="mt-2.5">
                            <Input
                              type="text"
                              disabled={!it.included}
                              placeholder="Commentaire ou mention pour cet article (ex: Offert pour fidélité, N° série...)"
                              value={it.notes}
                              onChange={(e) => handleOrderItemNotesChange(idx, e.target.value)}
                              className="h-8 text-[11px] bg-background border-border/60"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Direct Items List */
                <div className="space-y-3">
                  {directItems.map((row, idx) => {
                    const netPrice = row.isGift ? 0 : row.unitPrice * (1 - (row.discountPercent || 0) / 100);
                    const subtotal = row.quantity * netPrice;

                    return (
                      <div
                        key={row.id}
                        className="p-4 rounded-xl border border-border/70 bg-card space-y-3 shadow-xs"
                      >
                        {/* Row Header: Article Index & Action Buttons (Gift & Delete) */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-muted/80 border border-border/60 flex items-center justify-center text-[11px] font-mono font-bold text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-primary" />
                              <span>Désignation de l&apos;Article *</span>
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Gift Button Toggle */}
                            <Button
                              type="button"
                              size="sm"
                              variant={row.isGift ? 'default' : 'outline'}
                              onClick={() => handleDirectItemToggleGift(idx)}
                              className={`h-7 text-[11px] gap-1.5 px-2.5 rounded-lg font-semibold cursor-pointer ${
                                row.isGift
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                  : 'border-dashed border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                              }`}
                            >
                              <Gift className="h-3.5 w-3.5" />
                              <span>{row.isGift ? '🎁 Offert' : 'Cadeau ?'}</span>
                            </Button>

                            {/* Delete row button */}
                            {directItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveDirectItem(idx)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Full-width Product Search & Name Display */}
                        <div className="w-full">
                          <ProductSearchSelector
                            products={products}
                            selectedProductId={row.productId}
                            selectedProductName={row.productName}
                            selectedReference={row.reference}
                            onSelectProduct={(p) => handleDirectProductSelect(idx, p)}
                          />
                        </div>

                        {/* Financial Inputs: Qty, Brut Price, Discount %, Subtotal */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs items-center">
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Quantité
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={(e) =>
                                handleDirectItemQtyChange(idx, parseInt(e.target.value) || 1)
                              }
                              className="h-8 text-xs text-center font-bold bg-background"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              P.U Brut (DA)
                            </label>
                            <Input
                              type="number"
                              min={0}
                              disabled={row.isGift}
                              value={row.unitPrice}
                              onChange={(e) =>
                                handleDirectItemPriceChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs font-mono text-right bg-background"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1 flex items-center justify-between">
                              <span>Remise (%)</span>
                              {row.discountPercent > 0 && !row.isGift && (
                                <span className="text-emerald-600 font-bold">
                                  -{row.discountPercent}%
                                </span>
                              )}
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              disabled={row.isGift}
                              value={row.discountPercent}
                              onChange={(e) =>
                                handleDirectItemDiscountChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs font-mono text-center bg-background"
                            />
                          </div>

                          <div className="text-right">
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Sous-total Net
                            </label>
                            <span className="text-xs font-bold font-mono text-foreground block pt-1.5">
                              {row.isGift ? (
                                <span className="text-purple-600 font-bold">0 DA (Offert)</span>
                              ) : (
                                `${Math.round(subtotal).toLocaleString()} DA`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Article comment / note */}
                        <div>
                          <Input
                            type="text"
                            placeholder="Commentaire pour cet article (ex: Offert pour fidélité, Remise exceptionnelle, N° série...)"
                            value={row.notes}
                            onChange={(e) => handleDirectItemNotesChange(idx, e.target.value)}
                            className="h-8 text-[11px] bg-background border-border/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Destination & Delivery Notes */}
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">
                  3. Destination &amp; Instructions Chauffeur
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Searchable Région from DB (Disabled for regular users, admin can change) */}
                <SearchableSelectDropdown
                  label="Région"
                  value={region || (userRegion || user?.region || 'Centre Est')}
                  onChange={(val) => setRegion(val)}
                  options={regionOptions}
                  placeholder="Rechercher une région..."
                  disabled={!isAdmin}
                  disabledBadge="Verrouillé"
                  required
                />

                {/* Searchable Wilaya from DB (Disabled for regular users, admin can change) */}
                <SearchableSelectDropdown
                  label="Wilaya"
                  value={wilaya}
                  onChange={(val) => setWilaya(val)}
                  options={wilayaOptions}
                  placeholder="Rechercher une wilaya..."
                  disabled={!isAdmin}
                  disabledBadge="Selon client"
                  required
                />

                {/* Fixed Statut d'expédition selector with clear readable text */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">
                    Statut d&apos;expédition *
                  </label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus((v || 'in_transit') as 'in_transit' | 'delivered' | 'pending')}
                  >
                    <SelectTrigger className="h-10 text-xs bg-background font-semibold border-border/70 w-full rounded-lg">
                      <SelectValue placeholder="Choisir un statut...">
                        <span className="font-bold text-foreground">
                          {STATUS_OPTIONS[status]?.label || status}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="in_transit" className="text-xs py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            En cours d&apos;acheminement (En transit)
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Marchandise en cours d&apos;acheminement vers le client
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="delivered" className="text-xs py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Livré directement au client
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Colis réceptionné et acquitté par le destinataire
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending" className="text-xs py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            En attente d&apos;expédition
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            En cours de préparation dans les locaux logistiques
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Adresse précise de livraison
                </label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rue, quartier, dépôt, point de repère..."
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Instructions générales pour la livraison
                </label>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Consignes chauffeur, modalité de déchargement, téléphone contact..."
                  rows={2}
                  className="text-xs bg-background resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live BL Summary Sticky Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.04] to-transparent p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">
                    Aperçu du Bon de Livraison
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  {calculatedTotals.isFull ? 'Validation Totale' : 'Tranche Partielle'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Header Info with Client Name */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0 ring-2 ring-primary/20">
                  {clientName ? clientName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      BL-2026-NOUVEAU
                    </span>
                    <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 capitalize">
                      {status === 'delivered' ? 'Livré' : status === 'pending' ? 'En attente' : 'En transit'}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight truncate">
                    {clientName || 'Sélectionner un Client'}
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
                    {region || '—'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya :
                  </span>
                  <span className="font-semibold text-foreground">{wilaya || '—'}</span>
                </div>

                {activeTab === 'from_order' && selectedOrder && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-500" /> Commande :
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold border-blue-500/30 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30">
                      {selectedOrder.order_code}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Délégué :
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">
                    {delegateName || 'Délégué Commercial'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary" /> Articles Inclus :
                  </span>
                  <span className="font-bold text-foreground">{calculatedTotals.itemsCount} ligne(s)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-purple-500" /> Quantité Totale :
                  </span>
                  <span className="font-bold text-primary">{calculatedTotals.totalQty} unité(s)</span>
                </div>

                {calculatedTotals.totalGifts > 0 && (
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5" /> Articles Cadeaux :
                    </span>
                    <span>{calculatedTotals.totalGifts} unité(s) offertes</span>
                  </div>
                )}
              </div>

              {/* Total Amount Box */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Montant Total Net BL
                  </span>
                  <span className="text-xl font-black text-primary tracking-tight font-mono">
                    {calculatedTotals.totalAmount.toLocaleString()} DA
                  </span>
                </div>
                <Truck className="h-6 w-6 text-primary opacity-60" />
              </div>
            </CardContent>

            <div className="p-4 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetForm}
                disabled={submitting}
                className="text-xs text-muted-foreground hover:text-foreground h-9 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Effacer</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={submitting || calculatedTotals.itemsCount === 0 || !clientName}
                className="gap-2 rounded-xl h-9 px-5 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Créer le Bon</span>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Secondary back button */}
          <Link href="/delivery-notes" className="block">
            <Button
              variant="outline"
              type="button"
              className="w-full rounded-xl text-xs h-10 gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour aux Bons de Livraison</span>
            </Button>
          </Link>
        </div>
      </div>
    </form>
  );
}
