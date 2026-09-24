'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, ShieldCheck, MapPin, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ordersService, type OrderData } from '@/services/orders';

interface PendingOrderItem {
  id: string;
  orderCode: string;
  client: string;
  region: string;
  amount: number;
  time: string;
}

export function ApprovalQueue() {
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingOrders = () => {
    ordersService
      .list({ status: 'pending', pageSize: 10 })
      .then((res) => {
        if (res.data) {
          const mapped: PendingOrderItem[] = res.data.map((o: OrderData) => ({
            id: o.id,
            orderCode: o.order_code,
            client: o.client_name,
            region: o.region,
            amount: Number(o.total_amount) || 0,
            time: 'En attente',
          }));
          setOrders(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingOrders();

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id && detail?.status && detail.status !== 'pending') {
        setOrders((prev) => prev.filter((o) => o.id !== detail.id));
      } else {
        fetchPendingOrders();
      }
    };

    window.addEventListener('sti-order-updated', handleUpdate);
    window.addEventListener('sti-order-created', fetchPendingOrders);
    window.addEventListener('sti-order-deleted', handleUpdate);
    window.addEventListener('sti-websocket-event', fetchPendingOrders);
    return () => {
      window.removeEventListener('sti-order-updated', handleUpdate);
      window.removeEventListener('sti-order-created', fetchPendingOrders);
      window.removeEventListener('sti-order-deleted', handleUpdate);
      window.removeEventListener('sti-websocket-event', fetchPendingOrders);
    };
  }, []);

  const handleApprove = async (id: string, code: string) => {
    try {
      const res = await ordersService.updateStatus(id, 'validated');
      setOrders((prev) => prev.filter((o) => o.id !== id));
      const blCode = res?.delivery_note?.delivery_note_code;
      const blMsg = blCode ? ` (Bon de Livraison ${blCode} généré)` : '';
      toast.success(`Commande ${code} validée avec succès${blMsg}`);
    } catch {
      toast.error(`Échec de la validation de la commande ${code}`);
    }
  };

  const handleReject = async (id: string, code: string) => {
    try {
      await ordersService.updateStatus(id, 'cancelled');
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.error(`Commande ${code} annulée`);
    } catch {
      toast.error(`Échec de l'annulation de la commande ${code}`);
    }
  };

  return (
    <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Approval Queue</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none">
                {orders.length} Pending
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Commandes en attente de validation administrateur
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-2 flex-1 flex flex-col justify-between">
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="font-mono text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors text-left cursor-pointer"
                      title="View order details"
                    >
                      {order.orderCode}
                    </button>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      {order.region}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate">{order.client}</h4>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {order.amount.toLocaleString('fr-FR')} DA
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="View order"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(order.id, order.orderCode)}
                    className="h-8 w-8 p-0 rounded-lg text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    title="Reject Order"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApprove(order.id, order.orderCode)}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    title="Approve Order"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Valider</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2 my-auto">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-muted-foreground">Aucune commande en attente de validation</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
