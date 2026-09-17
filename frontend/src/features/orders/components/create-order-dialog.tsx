'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Plus,
  Trash2,
  User,
  Package,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { clientsService, type ClientData } from '@/services/clients';
import { productsService, type ProductData } from '@/services/products';
import { ordersService } from '@/services/orders';
import { usePermissions } from '@/hooks/use-permissions';
import { formatCurrency } from '../utils';
import { toast } from 'sonner';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: () => void;
}

interface OrderItemRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  const { isCommercial, isRestrictedByRegion, region: userRegion } = usePermissions();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  // Load clients and products when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingData(true);
      Promise.all([
        clientsService.list({ pageSize: 100 }),
        productsService.list({ pageSize: 100 }),
      ])
        .then(([clientsRes, productsRes]) => {
          setClients(clientsRes.data || []);
          setProducts(productsRes.data || []);

          // Initialize with 1 empty product row
          if (productsRes.data && productsRes.data.length > 0 && items.length === 0) {
            const firstProd = productsRes.data[0];
            setItems([
              {
                id: String(Date.now()),
                productId: firstProd.id,
                productName: firstProd.name,
                sku: firstProd.sku || firstProd.code || 'SKU-001',
                quantity: 10,
                unitPrice: Number(firstProd.sellingPrice || firstProd.nominalPrice || firstProd.price || 0),
              },
            ]);
          }
        })
        .catch(() => {
          toast.error('Erreur lors du chargement des clients et produits.');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [open]);

  const isRegionLocked = Boolean((isCommercial || isRestrictedByRegion) && userRegion);
  const filteredClients = isRegionLocked
    ? clients.filter((c) => (c.region || '').toLowerCase().trim() === userRegion!.toLowerCase().trim())
    : clients;

  const selectedClient = clients.find((c) => String(c.id) === String(selectedClientId));

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
      },
    ]);
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

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client.');
      return;
    }

    if (items.length === 0) {
      toast.error('Veuillez ajouter au moins un produit.');
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
        items: items.map((i) => ({
          product_id: i.productId,
          product_name: i.productName,
          reference: i.sku,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          subtotal: i.quantity * i.unitPrice,
        })),
      };

      const newOrder = await ordersService.create(payload);

      toast.success(`Commande ${newOrder.order_code || 'créée'} avec succès !`);
      onOpenChange(false);
      onOrderCreated?.();

      // Reset form
      setSelectedClientId('');
      setItems([]);
      setDeliveryAddress('');
      setNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création de la commande.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-border/40 shadow-xl">
        <DialogHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">Nouvelle Commande</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Créer une nouvelle commande de distribution pour un client.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">Chargement des données clients et produits...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            {/* Section 1: Client Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Sélection du Client
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Client *</label>
                  <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || '')}>
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border/60 bg-card">
                      <SelectValue placeholder="Choisir un client...">
                        {selectedClient ? selectedClient.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} — {c.wilaya} ({c.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClient && (
                  <Card className="border border-primary/20 bg-primary/5 rounded-xl p-3">
                    <CardContent className="p-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{selectedClient.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-background">
                          {selectedClient.wilaya}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Délégué: <strong className="text-foreground">{selectedClient.delegateName || 'Délégué Commercial'}</strong>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Section 2: Products List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Articles de la Commande
                  </h4>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-8 text-xs font-bold gap-1.5 rounded-lg border-border/60 hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un produit</span>
                </Button>
              </div>

              <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-xs">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border/40">
                    <tr>
                      <th className="text-left font-bold text-muted-foreground px-3 py-2.5">Produit</th>
                      <th className="text-center font-bold text-muted-foreground px-3 py-2.5 w-28">Quantité</th>
                      <th className="text-right font-bold text-muted-foreground px-3 py-2.5 w-32">Prix Unitaire (DA)</th>
                      <th className="text-right font-bold text-muted-foreground px-3 py-2.5 w-32">Sous-Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-t border-border/30 hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <Select
                            value={row.productId}
                            onValueChange={(val) => val && handleProductChange(row.id, val)}
                          >
                            <SelectTrigger className="h-8 text-xs rounded-lg border-border/50 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id} className="text-xs">
                                  {p.name} ({p.sku || p.code}) — {formatCurrency(p.sellingPrice || p.nominalPrice || p.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.id, Number(e.target.value))}
                            className="h-8 text-xs text-center font-bold rounded-lg border-border/50 bg-background"
                          />
                        </td>

                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min="0"
                            step="10"
                            value={row.unitPrice}
                            onChange={(e) => handleUnitPriceChange(row.id, Number(e.target.value))}
                            className="h-8 text-xs text-right font-semibold rounded-lg border-border/50 bg-background"
                          />
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          {formatCurrency(row.quantity * row.unitPrice)}
                        </td>

                        <td className="px-2 py-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(row.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 border-t border-border/40">
                    <tr>
                      <td colSpan={2} className="px-3 py-2.5 font-bold text-muted-foreground">
                        Total Articles : <strong className="text-foreground">{totalQuantity} unités</strong>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-muted-foreground">
                        Montant Total :
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-primary text-sm">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 3: Delivery & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Adresse de Livraison
                </label>
                <Input
                  placeholder="Adresse de livraison..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border/60 bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Notes / Instructions
                </label>
                <Textarea
                  placeholder="Notes particulières..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs rounded-xl border-border/60 bg-card resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs font-semibold rounded-xl border-border/60"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting || !selectedClientId}
                className="h-9 text-xs font-bold gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Créer la Commande ({formatCurrency(totalAmount)})</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
