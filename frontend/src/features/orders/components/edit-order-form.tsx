'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { ordersService, type OrderData } from '@/services/orders';
import { mockOrders } from '@/features/orders/mock-data';
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
  ShoppingBag,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  Building2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItemRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface EditOrderFormProps {
  orderId: string;
}

export function EditOrderForm({ orderId }: EditOrderFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Original Order Data
  const [originalOrder, setOriginalOrder] = useState<OrderData | null>(null);

  // Reference Directories
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Form Fields
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [status, setStatus] = useState<string>('pending');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const populateFormWithOrder = (orderData: OrderData) => {
    setOriginalOrder(orderData);
    setSelectedClientId(orderData.client_id ? String(orderData.client_id) : '');
    setDeliveryAddress(orderData.delivery_address || '');
    setNotes(orderData.notes || '');
    setPaymentMethod(orderData.payment_method || 'Cash on Delivery');
    setPriority(orderData.priority || 'normal');
    setStatus(orderData.status || 'pending');

    if (orderData.items && orderData.items.length > 0) {
      setItems(
        orderData.items.map((item, idx) => ({
          id: item.id || `item-${idx}-${Date.now()}`,
          productId: item.product_id || '',
          productName: item.product_name,
          sku: item.reference || 'SKU',
          quantity: item.quantity || 1,
          unitPrice: Number(item.unit_price) || 0,
        }))
      );
    }
  };

  useEffect(() => {
    let active = true;
    setLoadingData(true);

    Promise.all([
      ordersService.get(orderId).catch(() => null),
      clientsService.list({ pageSize: 100 }).catch(() => ({ data: [] })),
      productsService.list({ pageSize: 100 }).catch(() => ({ data: [] })),
    ])
      .then(([orderRes, clientsRes, productsRes]) => {
        if (!active) return;

        const loadedClients = clientsRes?.data || [];
        const loadedProducts = productsRes?.data || [];
        setClients(loadedClients);
        setProducts(loadedProducts);

        if (orderRes) {
          populateFormWithOrder(orderRes);
        } else {
          // Fallback to mock order
          const mockFound = mockOrders.find((m) => m.id.toLowerCase() === orderId.toLowerCase());
          if (mockFound) {
            const mapped: OrderData = {
              id: mockFound.id,
              order_code: mockFound.orderNumber,
              client_id: mockFound.clientId,
              client_name: mockFound.clientName,
              delegate_id: mockFound.delegateId,
              delegate_name: mockFound.delegateName,
              region: mockFound.region,
              wilaya: mockFound.wilaya,
              delivery_address: mockFound.deliveryAddress || `${mockFound.wilaya}, ${mockFound.region}`,
              total_amount: mockFound.totalAmount,
              status: mockFound.status as any,
              payment_method: mockFound.paymentMethod || 'cash',
              priority: mockFound.priority || 'normal',
              notes: mockFound.notes || '',
              created_at: mockFound.createdAt,
              updated_at: mockFound.updatedAt,
              items: (mockFound.items || []).map((item) => ({
                id: item.id,
                product_name: item.productName,
                reference: item.sku,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                subtotal: item.total || item.unitPrice * item.quantity,
              })),
            };
            populateFormWithOrder(mapped);
          } else {
            toast.error('Commande introuvable.');
          }
        }
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => String(c.id) === String(selectedClientId)) || (originalOrder ? {
      id: originalOrder.client_id ? String(originalOrder.client_id) : '',
      name: originalOrder.client_name,
      wilaya: originalOrder.wilaya || '',
      region: originalOrder.region || '',
      delegateName: originalOrder.delegate_name || '',
    } as any : null);
  }, [clients, selectedClientId, originalOrder]);

  const handleAddRow = () => {
    const firstProd = products[0];
    const newId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (firstProd) {
      setItems((prev) => [
        ...prev,
        {
          id: newId,
          productId: firstProd.id,
          productName: firstProd.name,
          sku: firstProd.sku || firstProd.code || 'SKU-001',
          quantity: 1,
          unitPrice: Number(firstProd.sellingPrice || firstProd.nominalPrice || firstProd.price || 0),
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: newId,
          productId: '',
          productName: 'Nouveau Produit',
          sku: 'SKU',
          quantity: 1,
          unitPrice: 0,
        },
      ]);
    }
  };

  const handleRemoveRow = (rowId: string) => {
    if (items.length <= 1) {
      toast.warning('Une commande doit comporter au moins un produit.');
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

  const handleResetForm = () => {
    if (originalOrder) {
      populateFormWithOrder(originalOrder);
      setErrors({});
      toast.info('Modifications annulées. Données réinitialisées.');
    }
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedClientId && !selectedClient?.name) {
      errs.client = 'Veuillez sélectionner un client.';
    }
    if (items.length === 0) {
      errs.items = 'Au moins un article est requis dans la commande.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs avant de valider.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        client_id: selectedClientId || originalOrder?.client_id,
        client_name: selectedClient?.name || originalOrder?.client_name || '',
        delegate_name: selectedClient?.delegateName || originalOrder?.delegate_name || 'Délégué Commercial',
        region: selectedClient?.region || originalOrder?.region || 'Algiers',
        wilaya: selectedClient?.wilaya || originalOrder?.wilaya || '',
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        priority,
        status: status as any,
        notes,
        items: items.map((i) => ({
          product_id: i.productId || undefined,
          product_name: i.productName,
          reference: i.sku,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          subtotal: i.quantity * i.unitPrice,
        })),
      };

      await ordersService.update(orderId, payload);
      toast.success('Commande mise à jour avec succès !');
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="p-16 flex flex-col items-center justify-center gap-3 border border-border/40 rounded-2xl bg-card">
        <Loader2 className="h-9 w-9 text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement des données de la commande...</p>
      </Card>
    );
  }

  if (!originalOrder) {
    return (
      <div className="p-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Commande Introuvable</h2>
        <p className="text-xs text-muted-foreground">
          La commande avec l&apos;identifiant <span className="font-mono font-bold text-foreground">#{orderId}</span> n&apos;existe pas ou a été supprimée.
        </p>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste des commandes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${orderId}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-8 w-8 p-0 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Modifier la Commande</span>
              <span className="font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg text-sm font-semibold">
                {originalOrder.order_code || `ORD-${orderId.slice(0, 8)}`}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Mettez à jour les articles, le client, le mode de paiement et les détails d&apos;expédition.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs border-border/70 hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Réinitialiser</span>
          </Button>

          <Link href={`/orders/${orderId}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-full h-9 px-4 font-semibold text-xs border-border/70 hover:bg-muted"
            >
              <span>Annuler</span>
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="gap-2 rounded-full h-9 px-5 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Enregistrer les Modifications</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid: Left 2 cols for form, Right 1 col for summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Order Form Panels (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel 1: Client Selection */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">1. Informations du Client</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sélectionnez le client bénéficiaire de cette commande.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Client Associé *</span>
                  {errors.client && <span className="text-[11px] text-rose-500 font-medium">{errors.client}</span>}
                </label>
                <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || '')}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-border/60 bg-card">
                    <SelectValue placeholder="Choisir un client...">
                      {selectedClient ? selectedClient.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} — {c.wilaya} ({c.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Client</span>
                    <strong className="text-foreground text-sm font-bold">{selectedClient.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Localisation</span>
                    <span className="text-muted-foreground">
                      Wilaya : <strong className="text-foreground">{selectedClient.wilaya || 'N/A'}</strong> ({selectedClient.region || 'Algiers'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Délégué Commercial</span>
                    <strong className="text-foreground">{selectedClient.delegateName || 'Délégué Commercial'}</strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel 2: Items Table */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">2. Articles & Produits</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Modifiez les quantités, les prix unitaires ou ajoutez de nouveaux articles.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/60 hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Ajouter un Article</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="text-left font-bold text-muted-foreground px-4 py-3">Produit / Article</th>
                      <th className="text-center font-bold text-muted-foreground px-3 py-3 w-28">Quantité</th>
                      <th className="text-right font-bold text-muted-foreground px-3 py-3 w-36">Prix Unitaire (DA)</th>
                      <th className="text-right font-bold text-muted-foreground px-4 py-3 w-36">Sous-Total</th>
                      <th className="w-12 text-center py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          {products.length > 0 ? (
                            <Select
                              value={row.productId}
                              onValueChange={(val) => val && handleProductChange(row.id, val)}
                            >
                              <SelectTrigger className="h-9 text-xs rounded-xl border-border/50 bg-background">
                                <SelectValue placeholder={row.productName || 'Sélectionner un produit...'} />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs">
                                    {p.name} ({p.sku || p.code}) — {formatCurrency(p.sellingPrice || p.nominalPrice || p.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={row.productName}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((i) => (i.id === row.id ? { ...i, productName: e.target.value } : i))
                                )
                              }
                              placeholder="Nom du produit"
                              className="h-9 text-xs rounded-xl border-border/50 bg-background"
                            />
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.id, Number(e.target.value))}
                            className="h-9 text-xs text-center font-bold rounded-xl border-border/50 bg-background"
                          />
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="10"
                            value={row.unitPrice}
                            onChange={(e) => handleUnitPriceChange(row.id, Number(e.target.value))}
                            className="h-9 text-xs text-right font-semibold rounded-xl border-border/50 bg-background"
                          />
                        </td>

                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(row.quantity * row.unitPrice)}
                        </td>

                        <td className="px-2 py-2.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(row.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t border-border/40">
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground">
                        Total Quantité : <strong className="text-foreground">{totalQuantity} unités</strong>
                      </td>
                      <td colSpan={2} className="px-3 py-3 text-right text-muted-foreground">
                        Montant Total Estimé :
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary text-sm">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Panel 3: Delivery & Notes */}
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">3. Livraison & Instructions</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Adresse physique de livraison et remarques spécifiques.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Adresse Complète de Livraison
                </label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Adresse de livraison, rue, ville..."
                  className="h-10 text-xs rounded-xl border-border/60 bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Notes & Instructions Logistiques
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions de livraison, contraintes d'horaires, observations..."
                  rows={3}
                  className="text-xs rounded-xl border-border/60 bg-card resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Order Summary & Configuration Panel (1 Col) */}
        <div className="space-y-6">
          <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card sticky top-6">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Paramètres de la Commande</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    État, priorité et conditions financières.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Statut de la Commande</label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'pending')}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className="text-xs">En attente (Pending)</SelectItem>
                    <SelectItem value="partially_validated" className="text-xs">Validation Partielle</SelectItem>
                    <SelectItem value="validated" className="text-xs">Validée (Validated)</SelectItem>
                    <SelectItem value="processing" className="text-xs">En Préparation (Processing)</SelectItem>
                    <SelectItem value="delivered" className="text-xs">Livrée (Delivered)</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Annulée (Cancelled)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Niveau de Priorité</label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val || 'normal')}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs">Basse (Low)</SelectItem>
                    <SelectItem value="normal" className="text-xs">Normale (Normal)</SelectItem>
                    <SelectItem value="high" className="text-xs">Haute (High)</SelectItem>
                    <SelectItem value="urgent" className="text-xs">Urgente (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mode de Paiement</label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || 'Cash on Delivery')}>
                  <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash on Delivery" className="text-xs">Paiement à la Livraison (Espèces)</SelectItem>
                    <SelectItem value="Virement Bancaire" className="text-xs">Virement Bancaire</SelectItem>
                    <SelectItem value="Chèque" className="text-xs">Chèque Certifié</SelectItem>
                    <SelectItem value="Crédit Client" className="text-xs">Crédit Échéancier Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                  Récapitulatif Financier
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Articles distincts :</span>
                  <strong className="text-foreground">{items.length}</strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Quantité :</span>
                  <strong className="text-foreground">{totalQuantity} unités</strong>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                  <span className="font-bold text-foreground">Total Commande :</span>
                  <span className="text-base font-extrabold text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 font-bold text-xs gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Enregistrer les Modifications</span>
                    </>
                  )}
                </Button>

                <Link href={`/orders/${orderId}`} className="block w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold rounded-xl border-border/60 hover:bg-muted"
                  >
                    Retour aux Détails
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
