'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ordersService, type OrderData, type OrderItemData } from '@/services/orders';
import { clientsService, type ClientData } from '@/services/clients';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { OrderPriorityBadge } from '@/features/orders/components/order-priority-badge';
import { mockOrders } from '@/features/orders/mock-data';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  Building2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  XCircle,
  Receipt,
  FileCheck,
  Send,
  Boxes,
  Zap,
  History,
  Eye,
  Pencil,
  MessageSquareText,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { RejectOrderDialog } from '@/features/orders/components/reject-order-dialog';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const id = (params?.id as string) || '';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientData | null>(null);
  const [delegateDetails, setDelegateDetails] = useState<DelegateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleConfirmReject = async (orderId: string, reason: string) => {
    // Immediately reflect rejection in UI and reset validated quantities
    setOrder((prev) => (prev ? { ...prev, status: 'rejected', rejection_reason: reason } : null));
    setValidatedQty({});
    try {
      await ordersService.updateStatus(orderId, 'rejected', undefined, undefined, reason);
      toast.success('Commande rejetée avec succès.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du rejet de la commande.');
      throw err;
    }
  };

  // Stepper state for item-level validation
  const [validatedQty, setValidatedQty] = useState<Record<string, number>>({});

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const loadOrderData = async (showToast = false) => {
    // Only accept valid UUID format for order details page
    if (!id || !UUID_REGEX.test(id)) {
      setLoading(false);
      setIsRefreshing(false);
      setOrder(null);
      return;
    }
    if (showToast) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await ordersService.get(id);
      if (data) {
        setOrder(data);

        // Try to fetch full client or delegate details if IDs are available
        if (data.client_id) {
          clientsService.get(data.client_id).then(setClientDetails).catch(() => setClientDetails(null));
        } else {
          setClientDetails(null);
        }
        if (data.delegate_id) {
          delegatesService.get(data.delegate_id).then(setDelegateDetails).catch(() => {});
        }

        // Initialize validation stepper mapping
        initValidatedQtyMap(data);
        if (showToast) toast.success('Données de la commande actualisées.');
        return;
      }
    } catch {
      // Fallback to local mock data ONLY if id matches mock id (never match orderNumber)
      const mockFound = mockOrders.find((m) => m.id.toLowerCase() === id.toLowerCase());
      if (mockFound) {
        const mappedMock: OrderData = {
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
          notes: mockFound.notes || 'Livraison standard par notre flotte régionale.',
          created_at: mockFound.createdAt,
          updated_at: mockFound.updatedAt,
          items: (mockFound.items || []).map((item) => ({
            id: item.id,
            product_name: item.productName,
            reference: item.sku,
            quantity: item.quantity,
            validated_quantity: item.validatedQuantity ?? item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.total || (item.unitPrice * item.quantity),
          })),
        };
        setOrder(mappedMock);
        initValidatedQtyMap(mappedMock);
        if (showToast) toast.info('Données chargées depuis le référentiel de démonstration.');
        return;
      }
      toast.error('Impossible de charger les informations de cette commande.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const initValidatedQtyMap = (orderData: OrderData) => {
    if (orderData.status === 'rejected' || orderData.status === 'cancelled') {
      setValidatedQty({});
      return;
    }
    const isCurrentlyPartial = orderData.status === 'partially_validated';
    const initial: Record<string, number> = {};
    (orderData.items || []).forEach((item, index) => {
      const itemId = item.id || `item-${index}`;
      if (isCurrentlyPartial) {
        const alreadyVal = item.validated_quantity ?? 0;
        const rem = Math.max(0, item.quantity - alreadyVal);
        initial[itemId] = rem;
      } else {
        initial[itemId] = item.quantity;
      }
    });
    setValidatedQty(initial);
  };

  useEffect(() => {
    loadOrderData();
  }, [id]);

  // Derived Calculations
  const isRejected = order?.status === 'rejected' || order?.status === 'cancelled';
  const isFullyCompleted = order?.status === 'validated' || order?.status === 'delivered';
  const isCurrentlyPartial = order?.status === 'partially_validated';

  const totalOrderedQty = useMemo(() => {
    return (order?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [order]);

  const totalAlreadyValQty = useMemo(() => {
    if (isRejected) return 0;
    if (order?.status === 'validated' || order?.status === 'delivered') {
      return totalOrderedQty;
    }
    return (order?.items || []).reduce((sum, item) => {
      return sum + (isCurrentlyPartial ? (item.validated_quantity ?? 0) : 0);
    }, 0);
  }, [order, isCurrentlyPartial, totalOrderedQty, isRejected]);

  const totalRemainingToValidateQty = isRejected || isFullyCompleted ? 0 : Math.max(0, totalOrderedQty - totalAlreadyValQty);

  const newSelectedQtySum = useMemo(() => {
    if (isRejected || !order?.items) return 0;
    return order.items.reduce((sum, item, idx) => {
      const key = item.id || `item-${idx}`;
      return sum + (validatedQty[key] ?? 0);
    }, 0);
  }, [order, validatedQty, isRejected]);

  const finalTotalValidatedQty = isRejected
    ? 0
    : isCurrentlyPartial
    ? totalAlreadyValQty + newSelectedQtySum
    : isFullyCompleted
    ? totalOrderedQty
    : newSelectedQtySum;

  const newSelectedAmountSum = useMemo(() => {
    if (isRejected || !order?.items) return 0;
    return order.items.reduce((sum, item, idx) => {
      const key = item.id || `item-${idx}`;
      const qty = validatedQty[key] ?? 0;
      return sum + qty * (item.unit_price || 0);
    }, 0);
  }, [order, validatedQty, isRejected]);

  const totalAlreadyValAmount = useMemo(() => {
    if (isRejected || !order?.items) return 0;
    return order.items.reduce((sum, item) => {
      const alreadyVal = isCurrentlyPartial ? (item.validated_quantity ?? 0) : 0;
      return sum + alreadyVal * (item.unit_price || 0);
    }, 0);
  }, [order, isCurrentlyPartial, isRejected]);

  const isFullValidation = !isRejected && finalTotalValidatedQty === totalOrderedQty;
  const isZeroSelection = newSelectedQtySum === 0;

  const validationProgress = isRejected
    ? 0
    : totalOrderedQty > 0
    ? Math.min(100, Math.round((finalTotalValidatedQty / totalOrderedQty) * 100))
    : 0;

  const handleQtyChange = (itemId: string, maxQtyAllowed: number, delta: number) => {
    if (isFullyCompleted || isRejected) return;
    setValidatedQty((prev) => {
      const current = prev[itemId] ?? maxQtyAllowed;
      const next = Math.max(0, Math.min(maxQtyAllowed, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleQtyInputChange = (itemId: string, maxQtyAllowed: number, rawVal: string) => {
    if (isFullyCompleted || isRejected) return;
    if (rawVal === '') {
      setValidatedQty((prev) => ({ ...prev, [itemId]: 0 }));
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(maxQtyAllowed, parsed));
    setValidatedQty((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const handleResetUnits = () => {
    if (!order || isFullyCompleted || isRejected) return;
    initValidatedQtyMap(order);
    toast.info('Quantités réinitialisées au solde restant.');
  };

  const handleFillAllRemaining = () => {
    if (!order || isFullyCompleted) return;
    const fullRem: Record<string, number> = {};
    (order.items || []).forEach((item, index) => {
      const itemId = item.id || `item-${index}`;
      const alreadyVal = item.validated_quantity ?? 0;
      fullRem[itemId] = Math.max(0, item.quantity - alreadyVal);
    });
    setValidatedQty(fullRem);
    toast.info('Toutes les unités restantes sélectionnées pour validation intégrale.');
  };

  const handleStatusUpdate = async (newStatus: string, customValidatedItems?: Record<string, number>) => {
    if (!order) return;
    setSubmitting(true);

    try {
      await ordersService.updateStatus(order.id, newStatus, customValidatedItems);
      setOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      toast.success(`Statut de la commande mis à jour: ${newStatus}`);
      loadOrderData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyValidation = async () => {
    if (!order) return;
    if (isZeroSelection && !isFullValidation) {
      toast.error('Veuillez sélectionner au moins 1 unité à valider.');
      return;
    }

    const payloadValidatedItems: Record<string, number> = {};
    (order.items || []).forEach((item, idx) => {
      const key = item.id || `item-${idx}`;
      if (isCurrentlyPartial) {
        const alreadyVal = item.validated_quantity ?? 0;
        payloadValidatedItems[item.id || key] = alreadyVal + (validatedQty[key] ?? 0);
      } else {
        payloadValidatedItems[item.id || key] = validatedQty[key] ?? item.quantity;
      }
    });

    const targetStatus = isFullValidation ? 'validated' : 'partially_validated';
    await handleStatusUpdate(targetStatus, payloadValidatedItems);
  };

  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString('fr-FR')} DA`;
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const printDocument = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 min-h-[450px]">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement des détails de la commande...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Commande Introuvable</h2>
        <p className="text-xs text-muted-foreground">
          La commande avec l&apos;identifiant <span className="font-mono font-bold text-foreground">#{id}</span> n&apos;a pas pu être trouvée. Seul l&apos;identifiant UUID est accepté pour accéder aux détails.
        </p>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste des commandes
          </Button>
        </Link>
      </div>
    );
  }

  const clientInitial = (order.client_name || 'Client').charAt(0).toUpperCase();
  const delegateName = order.delegate_name && order.delegate_name.toLowerCase() !== 'unassigned'
    ? order.delegate_name
    : (order.delegate?.name || 'Délégué Commercial');
  const delegateInitial = delegateName.charAt(0).toUpperCase();

  // Dynamic category workflow detection (plain calculations, no hooks after early returns)
  const isVirtualOnly = (() => {
    if (order.workflow_type === 'virtual') return true;
    if (order.workflow_type === 'physical') return false;
    if (!order.items || order.items.length === 0) return false;
    return order.items.every((item) => {
      if (item.is_virtual !== undefined) return item.is_virtual;
      const cat = ((item.category || '') + ' ' + (item.product_name || '')).toLowerCase();
      return cat.includes('credit') || cat.includes('recharge') || cat.includes('mobile_credit');
    });
  })();

  const hasPhysicalItems = (() => {
    if (order.has_physical_items !== undefined) return order.has_physical_items;
    if (order.workflow_type === 'physical') return true;
    if (!order.items || order.items.length === 0) return true;
    return order.items.some((item) => {
      if (item.is_virtual !== undefined) return !item.is_virtual;
      const cat = ((item.category || '') + ' ' + (item.product_name || '')).toLowerCase();
      return !cat.includes('credit') && !cat.includes('recharge') && !cat.includes('mobile_credit');
    });
  })();

  const hasVirtualItems = (() => {
    if (order.has_virtual_items !== undefined) return order.has_virtual_items;
    if (order.workflow_type === 'virtual') return true;
    if (!order.items || order.items.length === 0) return false;
    return order.items.some((item) => {
      if (item.is_virtual !== undefined) return item.is_virtual;
      const cat = ((item.category || '') + ' ' + (item.product_name || '')).toLowerCase();
      return cat.includes('credit') || cat.includes('recharge') || cat.includes('mobile_credit');
    });
  })();

  const isMixedOrder = hasVirtualItems && hasPhysicalItems;

  // Progress timeline steps adapted to category workflow
  const steps = isVirtualOnly
    ? [
        {
          label: 'Reçue',
          desc: 'Commande enregistrée',
          done: true,
          current: order.status === 'pending',
        },
        {
          label: isCurrentlyPartial ? 'Validation Partielle' : 'Validée & Crédit Injecté',
          desc: isCurrentlyPartial
            ? `${totalAlreadyValQty || newSelectedQtySum} / ${totalOrderedQty} unités validées`
            : order.status === 'validated' || order.status === 'delivered'
            ? 'Validation administrative immédiate & Crédit délivré'
            : 'En attente de validation',
          done: order.status === 'validated' || order.status === 'partially_validated' || order.status === 'delivered',
          current: order.status === 'validated' || order.status === 'partially_validated' || order.status === 'delivered',
          badge: 'Validation directe sans transport',
        },
      ]
    : [
        {
          label: 'Reçue',
          desc: 'Commande enregistrée',
          done: true,
          current: order.status === 'pending',
        },
        {
          label: isCurrentlyPartial ? 'Validation Partielle' : 'Validation Administrative',
          desc: isCurrentlyPartial
            ? `${totalAlreadyValQty || newSelectedQtySum} / ${totalOrderedQty} unités validées`
            : 'Validation et allocation de stock',
          done: order.status === 'validated' || order.status === 'partially_validated' || order.status === 'processing' || order.status === 'delivered',
          current: order.status === 'validated' || order.status === 'partially_validated',
        },
        {
          label: 'En Préparation / Expédition',
          desc: isCurrentlyPartial ? 'Expédition du lot validé' : 'Préparation et remise au transport',
          done: order.status === 'processing' || order.status === 'delivered',
          current: order.status === 'processing',
        },
        {
          label: 'Livrée',
          desc: 'Réception confirmée par le client',
          done: order.status === 'delivered',
          current: order.status === 'delivered',
        },
      ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumbs & Hero Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1.5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Accueil
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/orders" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Commandes
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/orders/${order.id}`} className="text-foreground text-xs font-semibold">
                  {order.order_code || `ORD-${order.id.slice(0, 8)}`}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <Link href="/orders" title="Retour aux commandes">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 w-8 p-0 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Commande {order.order_code}
              </h1>
              <OrderStatusBadge status={order.status} isVirtual={isVirtualOnly} />
              {order.priority && <OrderPriorityBadge priority={order.priority as any} />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Passée le {formatDateDisplay(order.created_at)} pour le client <span className="font-semibold text-foreground">{order.client_name}</span>
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOrderData(true)}
            disabled={isRefreshing}
            className="gap-2 rounded-full h-9 px-3.5 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Actualiser</span>
          </Button>

          {/* Preview & Print Bon Dialog Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>Aperçu du Bon</span>
          </Button>

          {/* Edit Order Button */}
          {can('orders.update') && (
            <Link href={`/orders/${order.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <span>Modifier</span>
              </Button>
            </Link>
          )}

          <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
              <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      <span>Aperçu du Bon • #{order.order_code}</span>
                    </DialogTitle>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold px-2 py-0.5">
                      Prévisualisation
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vérifiez attentivement les informations ci-dessous avant de procéder à l&apos;impression.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="rounded-full text-xs font-semibold h-8 px-3"
                  >
                    Fermer
                  </Button>
                  <Button
                    size="sm"
                    onClick={printDocument}
                    className="gap-1.5 rounded-full font-bold text-xs bg-primary text-primary-foreground shadow-md hover:bg-primary/90 h-8 px-3.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Imprimer</span>
                  </Button>
                </div>
              </DialogHeader>

              {/* Printable Template */}
              <div id="printable-order-content" className="space-y-6 pt-4 text-xs">
                {/* Company & Order Header */}
                <div className="flex items-start justify-between border-b border-border/40 pb-5">
                  <div className="space-y-1.5">
                    {/* Official Real Logo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/logo-sti.png"
                      alt="SARL Smart Technologie Innovation"
                      className="h-16 sm:h-20 w-auto object-contain"
                    />
                    <p className="text-muted-foreground text-[11px]">NIF: 001916012345678 • RC: 16/00-1234567B19</p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {order.order_code}
                    </span>
                    <p className="text-muted-foreground text-[11px] mt-1">Date: {formatDateDisplay(order.created_at)}</p>
                    <p className="text-muted-foreground text-[11px]">Statut: <strong className="uppercase">{order.status}</strong></p>
                  </div>
                </div>

                {/* Client & Delegate Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Destinataire</span>
                    <h4 className="font-bold text-foreground text-sm">{order.client_name}</h4>
                    <p className="text-muted-foreground text-[11px]">{order.delivery_address || `${order.wilaya}, ${order.region}`}</p>
                    <p className="text-muted-foreground text-[11px]">Région: <strong>{order.region}</strong> • Wilaya: <strong>{order.wilaya}</strong></p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Responsable Commercial</span>
                    <h4 className="font-bold text-foreground text-sm">{delegateName}</h4>
                    <p className="text-muted-foreground text-[11px]">Mode de Paiement: <strong className="capitalize">{order.payment_method}</strong></p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs border border-border/40 rounded-lg overflow-hidden">
                  <thead className="bg-muted/60 border-b border-border/40">
                    <tr>
                      <th className="text-left py-2 px-3 font-bold text-muted-foreground">Article / Référence</th>
                      <th className="text-center py-2 px-3 font-bold text-muted-foreground">Quantité</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">Prix Unitaire</th>
                      <th className="text-right py-2 px-3 font-bold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-border/30">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-foreground">{item.product_name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{item.reference || 'SKU-00'}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right text-muted-foreground">Total Général :</td>
                      <td className="py-2.5 px-3 text-right text-primary text-sm font-extrabold">{formatCurrency(order.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signature Box */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border/40">
                  <div className="border border-dashed border-border/60 rounded-xl p-4 h-24 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Cachet et Signature du Client</span>
                  </div>
                  <div className="border border-dashed border-border/60 rounded-xl p-4 h-24 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Signature du Délégué / Magasinier</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-between sm:justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-muted-foreground italic">
                  Document officiel STI Commande • Format Bon de Commande
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="rounded-full text-xs font-semibold"
                  >
                    Fermer l&apos;Aperçu
                  </Button>
                  <Button
                    size="sm"
                    onClick={printDocument}
                    className="gap-2 rounded-full font-bold text-xs bg-primary text-primary-foreground shadow-md hover:bg-primary/90 px-4"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Lancer l&apos;Impression</span>
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clean print stylesheet isolating only the printable sheet */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-order-content,
              #printable-order-content * {
                visibility: visible !important;
              }
              #printable-order-content {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          {/* Quick status transitions based on current status (conditioned on orders.update permission) */}
          {can('orders.update') ? (
            <>
              {order.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="gap-2 rounded-full h-9 px-3.5 font-semibold text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Rejeter</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={handleApplyValidation}
                    className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Valider la Commande</span>
                  </Button>
                  {!isVirtualOnly && (
                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={() => handleStatusUpdate('processing')}
                      className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                      <span>Passer en Préparation</span>
                    </Button>
                  )}
                </>
              )}

              {order.status === 'partially_validated' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => setIsRejectDialogOpen(true)}
                    className="gap-2 rounded-full h-9 px-3.5 font-semibold text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Rejeter</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={handleApplyValidation}
                    className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Valider le Reste ({newSelectedQtySum} unités)</span>
                  </Button>
                  {!isVirtualOnly && (
                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={() => handleStatusUpdate('processing')}
                      className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                      <span>Passer en Préparation</span>
                    </Button>
                  )}
                </>
              )}

              {order.status === 'validated' && (
                <>
                  {isVirtualOnly ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold h-9 px-4 inline-flex items-center gap-2 rounded-full shadow-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Validée</span>
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={() => handleStatusUpdate('processing')}
                      className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                    >
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                      <span>Passer en Préparation</span>
                    </Button>
                  )}
                </>
              )}

              {order.status === 'processing' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleStatusUpdate('validated')}
                    className="gap-2 rounded-full h-9 px-3 font-medium text-xs text-muted-foreground border-border/70 hover:bg-muted"
                    title="Revenir à Validée"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Revenir</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleStatusUpdate('delivered')}
                    className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                    <span>Confirmer la Livraison</span>
                  </Button>
                </>
              )}

              {order.status === 'delivered' && (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold h-9 px-4 inline-flex items-center gap-2 rounded-full shadow-xs">
                  {isVirtualOnly ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{isVirtualOnly ? 'Validée' : 'Commande Livrée'}</span>
                </Badge>
              )}

              {(order.status === 'cancelled' || order.status === 'rejected') && (
                <>
                  <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold h-9 px-4 inline-flex items-center gap-2 rounded-full shadow-xs">
                    <XCircle className="h-4 w-4" />
                    <span>{order.status === 'rejected' ? 'Commande Rejetée' : 'Commande Annulée'}</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleStatusUpdate('pending')}
                    className="gap-2 rounded-full h-9 px-3.5 font-semibold text-xs border-border/70 hover:bg-muted"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Réactiver</span>
                  </Button>
                </>
              )}
            </>
          ) : (
            <OrderStatusBadge status={order.status} />
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if Order is Rejected */}
      {isRejected && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 shadow-xs">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-rose-700 dark:text-rose-300">Commande Rejetée</h4>
                <Badge className="bg-rose-600 text-white border-0 text-[10px] font-bold uppercase tracking-wider">
                  Rejetée
                </Badge>
              </div>
              {order.rejection_reason ? (
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  <strong>Motif du rejet :</strong> « {order.rejection_reason} »
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucun motif de rejet spécifique n&apos;a été renseigné.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Cette commande a été annulée/rejetée et aucune validation ultérieure ne peut être réalisée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Order Hero Card */}
      <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-inner border border-primary/20 flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {order.order_code}
                  </h2>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    ID: {order.id.length > 12 ? `${order.id.slice(0, 10)}...` : order.id}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {order.client_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    {order.wilaya ? `${order.wilaya}, ` : ''}{order.region}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    {formatDateDisplay(order.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs pt-1 flex-wrap">
                  <Badge variant="outline" className="gap-1 font-semibold border-border/70 text-foreground bg-muted/40">
                    <CreditCard className="h-3 w-3 text-muted-foreground" /> Mode: <span className="capitalize">{order.payment_method || 'Espèces'}</span>
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                    <Boxes className="h-3 w-3" /> {(order.items || []).length} Produits Différents
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-semibold border-blue-500/30 text-blue-600 bg-blue-500/10">
                    <User className="h-3 w-3" /> Délégué: {delegateName}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Total Amount Badge */}
            <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2 p-4 rounded-xl bg-muted/40 border border-border/50 w-full lg:w-auto min-w-[240px]">
              <div className="text-left lg:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Montant Net de la Commande
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mt-0.5 block">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              <div className="h-px bg-border/40 w-full hidden lg:block" />
              <div className="text-left lg:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Progression de Validation
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {finalTotalValidatedQty} / {totalOrderedQty} unités ({validationProgress}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Financial & Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Amount */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Montant Total</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">{formatCurrency(order.total_amount)}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">Valeur marchande brute</span>
          </div>
        </Card>

        {/* KPI 2: Total Units Ordered */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unités Commandées</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">{totalOrderedQty} unités</span>
            <span className="text-xs text-muted-foreground block mt-0.5">{(order.items || []).length} articles au catalogue</span>
          </div>
        </Card>

        {/* KPI 3: Units Validated */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unités Validées</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-foreground">{finalTotalValidatedQty} / {totalOrderedQty}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              {totalOrderedQty - finalTotalValidatedQty > 0
                ? `${totalOrderedQty - finalTotalValidatedQty} restant à confirmer`
                : 'Validation complète 100%'}
            </span>
          </div>
        </Card>

        {/* KPI 4: Fulfillment Progress */}
        <Card className="border border-border/60 shadow-xs rounded-2xl p-5 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statut Logistique</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase text-foreground">{order.status}</span>
              <span className="text-xs font-bold text-primary">{validationProgress}%</span>
            </div>
            <Progress value={validationProgress} className="h-2 rounded-full" />
          </div>
        </Card>
      </div>

      {/* Main Grid: 2 columns left, 1 column right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Section (2 Spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products & Unit Validation Section */}
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold tracking-tight">
                      Détail des Articles Commandés
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Contrôlez les références, les prix unitaires et validez les quantités par article
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRejected ? (
                    <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold px-2.5 py-0.5">
                      Commande Rejetée
                    </Badge>
                  ) : isFullyCompleted ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5">
                      Validation Totale 100%
                    </Badge>
                  ) : isCurrentlyPartial ? (
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5">
                      Reste à valider: {totalRemainingToValidateQty} unités
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-0.5">
                      {totalOrderedQty} unités commandées
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Alert Banners */}
              {isRejected ? (
                <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>
                      Cette commande a été rejetée. Les stocks alloués ont été libérés et aucune validation supplémentaire n'est permise.
                    </span>
                  </div>
                  <span className="font-bold text-[11px] uppercase">Rejetée</span>
                </div>
              ) : isFullyCompleted ? (
                <div className="m-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>
                      {isVirtualOnly
                        ? 'Cette commande de recharge électronique a été validée avec succès (100% Validée).'
                        : 'Tous les articles ont été approuvés pour distribution intégrale.'}
                    </span>
                  </div>
                  <span className="font-bold text-[11px] uppercase">{isVirtualOnly ? 'Validée' : '100% Validé'}</span>
                </div>
              ) : isCurrentlyPartial ? (
                <div className="m-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Déjà validé: <strong>{totalAlreadyValQty} / {totalOrderedQty} unités</strong> ({formatCurrency(totalAlreadyValAmount)}).
                    </span>
                  </div>
                  <span className="font-bold text-[11px] uppercase">Solde restant</span>
                </div>
              ) : null}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="text-left font-bold text-muted-foreground px-4 py-3">Produit & Réf.</th>
                      <th className="text-center font-bold text-muted-foreground px-3 py-3">Commandé</th>
                      {isCurrentlyPartial && (
                        <>
                          <th className="text-center font-bold text-emerald-600 px-3 py-3">Déjà Validé</th>
                          <th className="text-center font-bold text-amber-600 dark:text-amber-400 px-3 py-3 bg-amber-500/5">
                            Solde Restant
                          </th>
                        </>
                      )}
                      <th className="text-center font-bold text-muted-foreground px-3 py-3">
                        {isCurrentlyPartial ? 'Unités à Envoyer' : 'Unités à Valider'}
                      </th>
                      <th className="text-right font-bold text-muted-foreground px-3 py-3">Prix Unitaire</th>
                      <th className="text-right font-bold text-muted-foreground px-4 py-3">Sous-Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, idx) => {
                      const key = item.id || `item-${idx}`;
                      const alreadyVal = isCurrentlyPartial ? (item.validated_quantity ?? 0) : 0;
                      const remainingLimit = isCurrentlyPartial ? Math.max(0, item.quantity - alreadyVal) : item.quantity;
                      const currentVal = isRejected ? 0 : (validatedQty[key] ?? remainingLimit);
                      const itemLineTotal = isRejected ? 0 : currentVal * (item.unit_price || 0);

                      return (
                        <tr key={key} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{item.product_name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{item.reference || 'SKU'}</div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-muted-foreground">
                            {item.quantity} unités
                          </td>

                          {isCurrentlyPartial && (
                            <>
                              <td className="px-3 py-3 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                                {alreadyVal} unités
                              </td>
                              <td className="px-3 py-3 text-center font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                                {remainingLimit} unités
                              </td>
                            </>
                          )}

                          {/* Stepper for editing validation quantities */}
                          <td className="px-3 py-3 text-center">
                            <div className={cn(
                              "inline-flex items-center gap-1 rounded-lg p-0.5",
                              (isFullyCompleted || isRejected) ? "bg-muted/20 border border-transparent" : "bg-muted/50 border border-border/50"
                            )}>
                              {!isFullyCompleted && !isRejected && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-background text-foreground"
                                  onClick={() => handleQtyChange(key, remainingLimit, -1)}
                                  disabled={currentVal <= 0}
                                  title="Diminuer"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              )}

                              {isFullyCompleted || isRejected ? (
                                <span className="w-12 text-center font-bold text-xs px-1 text-muted-foreground">
                                  {currentVal}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  max={remainingLimit}
                                  value={currentVal}
                                  onChange={(e) => handleQtyInputChange(key, remainingLimit, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  }}
                                  className={cn(
                                    "w-12 h-6 text-center font-bold text-xs bg-background/90 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                    currentVal === remainingLimit
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : currentVal > 0
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-rose-600"
                                  )}
                                  title={`Saisir la quantité validée (0 à ${remainingLimit})`}
                                />
                              )}

                              {!isFullyCompleted && !isRejected && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-background text-foreground"
                                  onClick={() => handleQtyChange(key, remainingLimit, 1)}
                                  disabled={currentVal >= remainingLimit}
                                  title="Augmenter"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-right text-muted-foreground font-medium">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">
                            {formatCurrency(itemLineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border/40 font-bold">
                    <tr>
                      <td colSpan={isCurrentlyPartial ? 5 : 3} className="px-4 py-3 text-right text-muted-foreground">
                        {isRejected ? 'Total Validé :' : isCurrentlyPartial ? 'Total Solde Restant Sélectionné :' : 'Total Validé :'}
                      </td>
                      <td className="px-3 py-3 text-center font-extrabold text-foreground">
                        {isRejected
                          ? `0 / ${totalOrderedQty} unités`
                          : isCurrentlyPartial
                          ? `${newSelectedQtySum} / ${totalRemainingToValidateQty} unités`
                          : `${finalTotalValidatedQty} / ${totalOrderedQty} unités`}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary text-sm">
                        {formatCurrency(isRejected ? 0 : isCurrentlyPartial ? newSelectedAmountSum : (totalAlreadyValAmount + newSelectedAmountSum))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Action Stepper controls (bottom bar) */}
              {!isFullyCompleted && !isRejected && (
                <div className="p-4 bg-muted/20 border-t border-border/30 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetUnits}
                      className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border/70 hover:bg-muted"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Réinitialiser</span>
                    </Button>

                    {can('orders.reject') && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsRejectDialogOpen(true)}
                        className="h-8 text-xs font-semibold gap-1.5 rounded-lg"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Rejeter la commande</span>
                      </Button>
                    )}

                    {isCurrentlyPartial && totalRemainingToValidateQty > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleFillAllRemaining}
                        className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>Tout Envoyer ({totalRemainingToValidateQty} unités restantes)</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isZeroSelection ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled
                        className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Sélectionnez les unités à envoyer</span>
                      </Button>
                    ) : isFullValidation ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={submitting}
                        onClick={handleApplyValidation}
                        className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span>Valider et Tout Envoyer (Validation Totale 100%)</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={submitting}
                        onClick={handleApplyValidation}
                        className="h-8 text-xs font-bold gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        <span>Valider et Envoyer le Lot ({newSelectedQtySum} unités)</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Validation History Section with Date & Time */}
              <div className="border-t border-border/40 p-5 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Historique des Validations & Envois ({order.validation_logs?.length || 0})
                    </h4>
                  </div>
                  {isCurrentlyPartial && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Solde restant à envoyer : {totalRemainingToValidateQty} unités
                    </span>
                  )}
                </div>

                {(!order.validation_logs || order.validation_logs.length === 0) ? (
                  <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl bg-card/40">
                    Aucun historique de validation enregistré pour cette commande.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {order.validation_logs.map((log, logIdx) => (
                      <div
                        key={log.id || logIdx}
                        className="p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                              Tranche #{log.batch_number || logIdx + 1}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-semibold",
                              log.status === 'validated'
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}>
                              {log.status === 'validated' ? 'Validation Totale' : 'Validation Partielle'}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDateDisplay(log.created_at)}
                            </span>
                          </div>

                          <div className="text-xs text-foreground font-semibold flex items-center gap-1.5 pt-0.5">
                            <span className="text-muted-foreground font-normal">Validé par :</span>
                            <span>{log.validated_by || 'Délégué Commercial'}</span>
                            {log.notes && (
                              <span className="text-muted-foreground text-[11px] italic font-normal">
                                • {log.notes}
                              </span>
                            )}
                          </div>

                          {/* Items in this batch */}
                          {log.items_payload && log.items_payload.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {log.items_payload.map((it: any, itIdx: number) => (
                                <span
                                  key={itIdx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 font-mono text-muted-foreground"
                                >
                                  {it.product_name}: <strong className="text-foreground font-bold">{it.quantity_validated} u.</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                          <span className="text-xs font-extrabold text-foreground block">
                            +{log.total_quantity} unités validées
                          </span>
                          <span className="text-[11px] font-bold text-primary block">
                            {formatCurrency(log.total_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Lifecycle Timeline */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base font-bold tracking-tight">
                  Suivi d&apos;Acheminement & Statut
                </CardTitle>
              </div>

              {/* Category-based Workflow Badge & Partial Indicator */}
              <div className="flex items-center gap-2 flex-wrap">
                {isVirtualOnly ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1.5 py-1 px-2.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Recharge Électronique (Validation Directe)</span>
                  </Badge>
                ) : isMixedOrder ? (
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs font-semibold gap-1.5 py-1 px-2.5">
                    <Boxes className="h-3.5 w-3.5" />
                    <span>Commande Mixte (Virtuel + Matériel)</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold gap-1.5 py-1 px-2.5">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Matériel Physique (Acheminement Requis)</span>
                  </Badge>
                )}

                {isCurrentlyPartial && (
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold gap-1.5 py-1 px-2.5 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Partiel ({totalAlreadyValQty || newSelectedQtySum}/{totalOrderedQty} unités)</span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {isVirtualOnly ? (
                /* Dedicated Spacious 2-Step Layout for Recharge / Virtual Orders */
                <div className="py-6 px-4 sm:px-12 bg-muted/15 rounded-2xl border border-border/40">
                  <div className="flex items-center justify-between relative max-w-2xl sm:max-w-3xl mx-auto">
                    {/* Connecting Progress Line */}
                    <div className="absolute left-16 right-16 top-6 h-1 -translate-y-1/2 bg-border/80 rounded-full z-0 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-700 rounded-full",
                          steps[1]?.done
                            ? isCurrentlyPartial
                              ? "bg-amber-500 w-full"
                              : "bg-emerald-500 w-full shadow-sm shadow-emerald-500/50"
                            : "bg-primary/50 w-1/2"
                        )}
                      />
                    </div>

                    {/* Step 1: Reçue */}
                    <div className="flex flex-col items-center text-center relative z-10 w-44 sm:w-56">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-md mb-3 ring-4",
                        steps[0]?.done
                          ? "bg-emerald-600 text-white shadow-emerald-500/25 ring-emerald-500/20"
                          : "bg-primary text-primary-foreground ring-primary/20"
                      )}>
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Étape 1 • Reçue
                      </span>
                      <h5 className="font-bold text-sm sm:text-base text-foreground">
                        {steps[0]?.label}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1 leading-normal max-w-[180px]">
                        {steps[0]?.desc}
                      </p>
                      <Badge variant="outline" className="mt-2.5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold px-2 py-0.5">
                        Enregistrée
                      </Badge>
                    </div>

                    {/* Step 2: Validation Administrative / Crédit Injecté */}
                    <div className="flex flex-col items-center text-center relative z-10 w-44 sm:w-56">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-md mb-3 ring-4",
                        steps[1]?.done
                          ? isCurrentlyPartial
                            ? "bg-amber-500 text-white shadow-amber-500/30 ring-amber-500/20 animate-pulse"
                            : "bg-emerald-600 text-white shadow-emerald-500/25 ring-emerald-500/20"
                          : steps[1]?.current
                          ? "bg-primary text-primary-foreground ring-primary/20 animate-pulse"
                          : "bg-muted text-muted-foreground ring-border/50 border border-border"
                      )}>
                        {steps[1]?.done ? (
                          isCurrentlyPartial ? <AlertCircle className="h-6 w-6" /> : <Zap className="h-6 w-6 fill-current" />
                        ) : (
                          <Zap className="h-6 w-6" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mb-1",
                        isCurrentlyPartial
                          ? "text-amber-600 dark:text-amber-400"
                          : steps[1]?.done
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}>
                        Étape 2 • {isCurrentlyPartial ? 'Validation Partielle' : 'Validation & Crédit'}
                      </span>
                      <h5 className="font-bold text-sm sm:text-base text-foreground">
                        {steps[1]?.label}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1 leading-normal max-w-[200px]">
                        {steps[1]?.desc}
                      </p>
                      {isCurrentlyPartial ? (
                        <Badge variant="outline" className="mt-2.5 text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold px-2 py-0.5 animate-pulse">
                          Partiel ({totalAlreadyValQty || newSelectedQtySum}/{totalOrderedQty})
                        </Badge>
                      ) : steps[1]?.done ? (
                        <Badge variant="outline" className="mt-2.5 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold px-2 py-0.5">
                          Crédit Injecté Directement
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-2.5 text-[10px] bg-muted text-muted-foreground font-medium px-2 py-0.5">
                          En attente de validation
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard 4-Step Layout for Physical Goods */
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-start gap-2 relative">
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-xs",
                          step.done
                            ? "bg-emerald-600 text-white shadow-emerald-500/30"
                            : step.current
                            ? "bg-primary text-primary-foreground animate-pulse ring-2 ring-primary/30"
                            : "bg-muted text-muted-foreground border border-border/80"
                        )}>
                          {step.done ? <CheckCircle2 className="h-4.5 w-4.5" /> : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={cn(
                            "h-0.5 flex-1 transition-colors",
                            step.done ? "bg-emerald-500/50" : "bg-border/60"
                          )} />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                          <span>{step.label}</span>
                        </h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Informative notice based on workflow type */}
              {isVirtualOnly && (
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Zap className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>
                    <strong>Recharge électronique directe :</strong> Le crédit est immédiatement injecté lors de la validation. Aucun transport ou bon de livraison physique n'est requis.
                  </span>
                </div>
              )}

              {isMixedOrder && (
                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                  <Boxes className="h-4 w-4 shrink-0 text-purple-500" />
                  <span>
                    <strong>Commande mixte :</strong> Les recharges sont validées et actives immédiatement, tandis que les cartes SIM et tickets suivent le cycle d'expédition physique jusqu'au client.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delegate Note & Rejection Reason Cards */}
          <div className={cn("grid gap-4", order.rejection_reason ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
            <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-bold tracking-tight">Note du Délégué Commercial</CardTitle>
                  </div>
                  {delegateName && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {delegateName}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className={cn("text-xs leading-relaxed", order.notes ? "text-foreground font-normal" : "text-muted-foreground italic")}>
                  {order.notes || "Aucune note particulière laissée par le délégué pour cette commande."}
                </p>
              </CardContent>
            </Card>

            {order.rejection_reason && (
              <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <CardTitle className="text-sm font-bold tracking-tight text-rose-600 dark:text-rose-400">Motif du Rejet</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-rose-600 bg-rose-500/10 border-rose-500/20 uppercase tracking-wider">
                      Rejetée
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-xs text-foreground leading-relaxed font-normal">
                    {order.rejection_reason}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Section: Details & Stakeholders (1 Span) */}
        <div className="space-y-6">
          {/* Client Information Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-primary" />
                  <CardTitle className="text-sm font-bold tracking-tight">Client Destinataire</CardTitle>
                </div>
                {clientDetails && order.client_id ? (
                  <Link href={`/clients/${order.client_id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 px-2 text-primary hover:text-primary">
                      <span>Profil</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20 font-medium">
                    Client Archivé / Supprimé
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {clientInitial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{order.client_name || 'Client Inconnu / Supprimé'}</h4>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {clientDetails?.clientCode || (order.client_id ? `CL-${String(order.client_id).padStart(5, '0')}` : 'CL-ARCHIVE')}
                  </span>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2 text-xs">
                {clientDetails?.phone ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Téléphone :
                    </span>
                    <a href={`tel:${clientDetails.phone}`} className="font-semibold text-foreground hover:underline">
                      {clientDetails.phone}
                    </a>
                  </div>
                ) : !clientDetails && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground/60" /> Téléphone :
                    </span>
                    <span className="text-muted-foreground italic text-[11px]">Non disponible</span>
                  </div>
                )}
                {clientDetails?.email ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Email :
                    </span>
                    <span className="font-semibold text-foreground">{clientDetails.email}</span>
                  </div>
                ) : !clientDetails && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/60" /> Email :
                    </span>
                    <span className="text-muted-foreground italic text-[11px]">Non disponible</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya :
                  </span>
                  <span className="font-semibold text-foreground">{order.wilaya || clientDetails?.wilaya || 'Non spécifiée'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Région :</span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-border/60">
                    {order.region || clientDetails?.region || 'National'}
                  </Badge>
                </div>
              </div>

              {order.delivery_address && (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[9px] block">Adresse de Livraison</span>
                  <p className="font-medium text-foreground">{order.delivery_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commercial Delegate Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-blue-600" />
                  <CardTitle className="text-sm font-bold tracking-tight">Délégué Commercial</CardTitle>
                </div>
                {order.delegate_id && (
                  <Link href={`/delegates/${order.delegate_id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 px-2 text-blue-600 hover:text-blue-600">
                      <span>Détails</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {delegateInitial}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{delegateName}</h4>
                  <span className="text-[11px] text-muted-foreground">Délégué Réseau • {order.region}</span>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2 text-xs">
                {delegateDetails?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Contact :
                    </span>
                    <a href={`tel:${delegateDetails.phone}`} className="font-semibold text-foreground hover:underline">
                      {delegateDetails.phone}
                    </a>
                  </div>
                )}
                {delegateDetails?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Email :
                    </span>
                    <span className="font-semibold text-foreground">{delegateDetails.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Secteur :</span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-blue-500/30 text-blue-600 bg-blue-500/10">
                    {order.region}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Logistics Summary Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-bold tracking-tight">Règlement & Logistique</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mode de Règlement :</span>
                <span className="font-bold uppercase text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                  {order.payment_method || 'Espèces'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Statut de la Facturation :</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {isVirtualOnly
                    ? (isFullyCompleted ? 'Validée & Acquittée' : 'En attente de validation')
                    : (order.status === 'delivered' ? 'Acquittée' : 'En attente de livraison')}
                </span>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Créée le :</span>
                <span className="font-medium text-foreground">{formatDateDisplay(order.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mise à jour :</span>
                <span className="font-medium text-foreground">{formatDateDisplay(order.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Order Dialog */}
      <RejectOrderDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        order={order ? {
          id: order.id,
          orderNumber: order.order_code,
          clientName: order.client_name,
          delegateName: delegateName,
        } : null}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
