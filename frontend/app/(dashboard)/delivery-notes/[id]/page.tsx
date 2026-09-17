'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deliveryNotesService } from '@/services/delivery-notes';
import type { DeliveryNoteData, DeliveryNoteStatus } from '@/features/delivery-notes/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  User,
  Calendar,
  FileText,
  Printer,
  ExternalLink,
  RefreshCw,
  Loader2,
  Package,
  Gift,
  Phone,
  Building2,
  ShieldCheck,
  Check,
  ShoppingBag,
} from 'lucide-react';

export default function DeliveryNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [deliveryNote, setDeliveryNote] = useState<DeliveryNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async (showRefreshToast = false) => {
    if (!id) return;
    if (showRefreshToast) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await deliveryNotesService.get(id);
      setDeliveryNote(data);
      if (showRefreshToast) toast.success('Données actualisées avec succès.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du chargement du bon de livraison.');
      setDeliveryNote(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStatus = async (newStatus: DeliveryNoteStatus) => {
    if (!deliveryNote || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await deliveryNotesService.updateStatus(deliveryNote.id, newStatus);
      setDeliveryNote((prev) => (prev ? { ...prev, status: updated.status, delivered_at: updated.delivered_at } : null));
      toast.success(`Statut mis à jour : ${getStatusLabel(newStatus)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: DeliveryNoteStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 gap-1.5 shadow-none">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Livré</span>
          </Badge>
        );
      case 'in_transit':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold px-2.5 py-0.5 gap-1.5 shadow-none">
            <Truck className="h-3.5 w-3.5" />
            <span>En Transit</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5 gap-1.5 shadow-none">
            <Clock className="h-3.5 w-3.5" />
            <span>En Attente</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold px-2.5 py-0.5 gap-1.5 shadow-none">
            <XCircle className="h-3.5 w-3.5" />
            <span>Annulé</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusLabel = (status: DeliveryNoteStatus) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'in_transit':
        return 'En Transit';
      case 'pending':
        return 'En Attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString('fr-FR')} DA`;
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 min-h-[450px]">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement du bon de livraison...</p>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className="p-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
          <FileText className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Bon de Livraison Introuvable</h2>
        <p className="text-xs text-muted-foreground">
          Le bon de livraison demandé n&apos;existe pas ou vous n&apos;avez pas les autorisations nécessaires pour y accéder.
        </p>
        <Link href="/delivery-notes">
          <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour aux bons de livraison
          </Button>
        </Link>
      </div>
    );
  }

  const isDelivered = deliveryNote.status === 'delivered';
  const isPartial = deliveryNote.validation_type === 'partial';
  const items = deliveryNote.items || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumbs & Hero Action Bar (hidden on print) */}
      <div className="print:hidden flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
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
                <BreadcrumbLink href="/delivery-notes" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                  Bons de Livraison
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/delivery-notes/${deliveryNote.id}`} className="text-foreground text-xs font-semibold">
                  {deliveryNote.delivery_note_code}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <Link href="/delivery-notes" title="Retour aux bons de livraison">
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
                Bon {deliveryNote.delivery_note_code}
              </h1>
              {getStatusBadge(deliveryNote.status)}
              {isPartial ? (
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5">
                  Validation Partielle (Lot #{deliveryNote.batch_number})
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5">
                  Validation Totale (100%)
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Émis le {deliveryNote.created_at ? format(new Date(deliveryNote.created_at), 'dd/MM/yyyy à HH:mm') : '—'} pour le client{' '}
            <span className="font-semibold text-foreground">{deliveryNote.client_name}</span>
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="gap-2 rounded-full h-9 px-3.5 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-amber-500 transition-transform duration-700', isRefreshing && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>

          {/* Associated Order Link */}
          {deliveryNote.order_id && (
            <Link href={`/orders/${deliveryNote.order_id}`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                <span>Commande {deliveryNote.order_code}</span>
              </Button>
            </Link>
          )}

          {/* Mark as Delivered Action */}
          {!isDelivered && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus('delivered')}
              disabled={updatingStatus}
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Marquer comme Livré</span>
            </Button>
          )}

          {/* Print Button */}
          <Button
            size="sm"
            onClick={handlePrint}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Imprimer le Bon</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: 2 Columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Section (2 Cols): Items, Notes, Official Receipt Format */}
        <div className="lg:col-span-2 space-y-6">
          {/* Printable Document Paper Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card p-0 py-0 gap-0">
            {/* STI Header on document */}
            <div className="p-6 bg-muted/20 border-b border-border/60 flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-card p-1.5 flex items-center justify-center border border-border/50 shadow-xs">
                  <Image
                    src="/assets/logo-sti.png"
                    alt="STI Distribution"
                    width={44}
                    height={44}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">STI Distribution</h3>
                  <p className="text-xs text-muted-foreground">Système Commercial & Logistique</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg inline-block">
                  {deliveryNote.delivery_note_code}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Date : {deliveryNote.created_at ? format(new Date(deliveryNote.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">Articles Inclus dans l&apos;Expédition</h4>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {items.length} référence(s) • {deliveryNote.total_quantity} unité(s)
                </Badge>
              </div>

              <div className="border border-border/60 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border/60">
                    <TableRow className="hover:bg-transparent border-b border-border/60">
                      <TableHead className="py-3 px-4 text-xs font-bold text-foreground">Désignation de l&apos;Article</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold text-foreground text-center">Quantité</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold text-foreground text-right">Prix Unitaire</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold text-foreground text-center">Remise</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold text-foreground text-right">Total Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id || idx} className="hover:bg-muted/30 transition-colors border-b border-border/40">
                        <TableCell className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{item.product_name}</span>
                              {item.is_gift && (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0 gap-1">
                                  <Gift className="h-2.5 w-2.5" /> Cadeau / Offert
                                </Badge>
                              )}
                            </div>
                            {item.reference && (
                              <p className="font-mono text-[11px] text-muted-foreground">Réf: {item.reference}</p>
                            )}
                            {item.notes && (
                              <p className="text-[11px] text-muted-foreground/80 italic">Note: {item.notes}</p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5 px-4 text-center font-bold text-xs text-foreground">
                          {item.quantity}
                        </TableCell>

                        <TableCell className="py-3.5 px-4 text-right text-xs font-mono text-muted-foreground">
                          {item.is_gift ? (
                            <span className="line-through text-[11px]">{formatCurrency(item.unit_price)}</span>
                          ) : (
                            formatCurrency(item.unit_price)
                          )}
                        </TableCell>

                        <TableCell className="py-3.5 px-4 text-center text-xs">
                          {item.discount_percent && item.discount_percent > 0 ? (
                            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                              -{item.discount_percent}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5 px-4 text-right font-bold font-mono text-xs text-foreground">
                          {item.is_gift ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 DA (Offert)</span>
                          ) : (
                            formatCurrency(item.subtotal)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Financial Recap */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-72 bg-muted/30 p-4 rounded-xl border border-border/50 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantité totale :</span>
                    <span className="font-bold text-foreground">{deliveryNote.total_quantity} unités</span>
                  </div>
                  <Separator className="bg-border/60" />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-foreground text-sm">Montant Total :</span>
                    <span className="text-base font-black text-primary font-mono">
                      {formatCurrency(deliveryNote.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chauffeur instructions / Delivery notes */}
            {deliveryNote.notes && (
              <div className="px-6 pb-6 pt-2">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-1">
                  <p className="text-xs font-bold text-foreground">Instructions & Remarques :</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{deliveryNote.notes}</p>
                </div>
              </div>
            )}

            {/* Signature & Stamp Boxes */}
            <div className="p-6 bg-muted/10 border-t border-border/60 grid grid-cols-2 gap-6">
              <div className="border border-dashed border-border/80 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs font-bold text-foreground">Visa & Cachet STI Distribution</p>
                <p className="text-[10px] text-muted-foreground">Signature du responsable logistique</p>
              </div>

              <div className="border border-dashed border-border/80 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs font-bold text-foreground">Accusé de Réception Client</p>
                <p className="text-[10px] text-muted-foreground">Date, nom & signature du réceptionnaire</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Section (1 Col): Client, Logistics, Status Updater */}
        <div className="space-y-6">
          {/* Client Details Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Client Destinataire</h4>
                <p className="text-[11px] text-muted-foreground">Détails de l&apos;acheteur</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Nom du client</span>
                <span className="font-bold text-foreground text-sm">{deliveryNote.client_name}</span>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">{deliveryNote.wilaya}</span>
                  {deliveryNote.region && <span className="text-[11px]"> • {deliveryNote.region}</span>}
                  {deliveryNote.delivery_address && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{deliveryNote.delivery_address}</p>
                  )}
                </div>
              </div>

              {deliveryNote.client_id && (
                <div className="pt-2">
                  <Link href={`/clients/${deliveryNote.client_id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8 rounded-xl font-semibold">
                      <ExternalLink className="h-3 w-3" />
                      <span>Fiche du client</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Logistics & Dispatch Card */}
          <Card className="border border-border/60 shadow-xs rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Logistique & Suivi</h4>
                <p className="text-[11px] text-muted-foreground">Informations d&apos;acheminement</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Commande source :</span>
                {deliveryNote.order_id ? (
                  <Link href={`/orders/${deliveryNote.order_id}`} className="font-mono font-bold text-primary hover:underline flex items-center gap-1">
                    <span>{deliveryNote.order_code}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{deliveryNote.order_code || 'DIRECT'}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Délégué assigné :</span>
                <span className="font-semibold text-foreground">{deliveryNote.delegate_name || 'Non assigné'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date d&apos;émission :</span>
                <span className="font-semibold text-foreground">
                  {deliveryNote.created_at ? format(new Date(deliveryNote.created_at), 'dd/MM/yyyy') : '—'}
                </span>
              </div>

              {deliveryNote.delivered_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date de livraison :</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {format(new Date(deliveryNote.delivered_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Status Updater Card (hidden on print) */}
          <Card className="print:hidden border border-border/60 shadow-xs rounded-2xl bg-card p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Mettre à jour le Statut</h4>
                <p className="text-[11px] text-muted-foreground">Modifier l&apos;état de l&apos;expédition</p>
              </div>
            </div>

            <div className="space-y-3">
              <Select
                value={deliveryNote.status}
                onValueChange={(val) => handleUpdateStatus(val as DeliveryNoteStatus)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full h-9 rounded-xl border-border/70 text-xs bg-background">
                  <SelectValue placeholder="Changer le statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  <SelectItem value="pending">En Attente</SelectItem>
                  <SelectItem value="in_transit">En Transit</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-[11px] text-muted-foreground">
                Dernière modification :{' '}
                <span className="font-medium text-foreground">
                  {deliveryNote.updated_at ? format(new Date(deliveryNote.updated_at), 'dd/MM/yyyy HH:mm') : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
