'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useNotificationsStore } from '../store';
import { notificationsService } from '@/services/notifications';
import { ordersService } from '@/services/orders';
import type { Notification } from '../types';
import { getCategoryColor, getPriorityColor, getStatusColor, getStatusDot, getStatusLabel } from '../utils';
import { Eye, ChevronLeft, ChevronRight, Bell, BellOff, Loader2 } from 'lucide-react';

export function NotificationsTable() {
  const router = useRouter();
  const {
    searchQuery,
    selectedCategories,
    selectedPriorities,
    selectedStatuses,
    selectedRegions,
    dateRange,
    refreshKey,
    triggerRefresh,
    setDetailsDrawerOpen,
  } = useNotificationsStore();

  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    notificationsService
      .list({
        search: searchQuery || undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        region: selectedRegions.length > 0 ? selectedRegions : undefined,
        startDate: dateRange?.start || undefined,
        endDate: dateRange?.end || undefined,
        page,
        pageSize,
      })
      .then((res) => {
        if (isMounted) {
          setData(res.data);
          setTotalPages(res.totalPages);
          setTotalItems(res.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategories, selectedPriorities, selectedStatuses, selectedRegions, dateRange, page, refreshKey]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const extractOrderCode = (n: Notification): string | null => {
    const fullText = `${n.referenceId || ''} ${n.title} ${n.description}`;
    const match = fullText.match(/ORD-[\w-]+/i);
    return match ? match[0] : null;
  };

  const resolveOrderUuid = async (n: Notification): Promise<string | null> => {
    // 1. Direct UUID from backend orderId
    if (n.orderId && UUID_REGEX.test(n.orderId.trim())) {
      return n.orderId.trim();
    }

    // 2. referenceId if it is already a UUID
    if (n.referenceId && UUID_REGEX.test(n.referenceId.trim())) {
      return n.referenceId.trim();
    }

    // 3. Search for UUID in notification title/description
    const fullText = `${n.title} ${n.description} ${n.referenceId || ''}`;
    const uuidMatch = fullText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch && UUID_REGEX.test(uuidMatch[0])) {
      return uuidMatch[0];
    }

    // 4. If we only have an order code (e.g. ORD-2026-000001), fetch its real UUID from the API
    const code = extractOrderCode(n);
    if (code) {
      try {
        const res = await ordersService.list({ search: code });
        const found = res.data.find(
          (o) => o.order_code?.toLowerCase() === code.toLowerCase() || o.id?.toLowerCase() === code.toLowerCase()
        );
        if (found && UUID_REGEX.test(found.id)) {
          return found.id;
        }
      } catch {
        // Look up failed
      }
    }

    return null;
  };

  const isOrderNotification = (n: Notification): boolean => {
    return (
      n.category === 'orders' ||
      n.module?.toLowerCase() === 'orders' ||
      Boolean(n.orderId) ||
      Boolean(extractOrderCode(n))
    );
  };

  const handleActionClick = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    if (isOrderNotification(n)) {
      const uuid = await resolveOrderUuid(n);
      if (uuid) {
        router.push(`/orders/${uuid}`);
      } else {
        router.push('/orders');
      }
    } else {
      setDetailsDrawerOpen(true, n.id);
    }
  };

  const handleRowClick = async (n: Notification) => {
    if (isOrderNotification(n)) {
      const uuid = await resolveOrderUuid(n);
      if (uuid) {
        router.push(`/orders/${uuid}`);
        return;
      }
    }
    setDetailsDrawerOpen(true, n.id);
  };

  return (
    <Card className="border border-border/40 shadow-xs hover:shadow-md transition-all rounded-[20px] overflow-hidden bg-card">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notification Records
          </CardTitle>
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Total: {totalItems}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[80px]">Time</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[100px]">Category</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10">Notification</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[120px]">User</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[90px]">Priority</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[90px]">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-10 w-[60px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 py-8">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">Fetching notifications registry...</p>
                        <p className="text-[11px] text-muted-foreground">Loading system alerts, orders and announcements</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <BellOff className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs font-semibold">No notifications found</p>
                      <p className="text-[11px] text-muted-foreground/70">
                        There are no notifications matching your current filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((n) => (
                  <TableRow
                    key={n.id}
                    className={cn('border-border/20 hover:bg-muted/30 transition-colors cursor-pointer', !n.read && 'bg-primary/5')}
                    onClick={() => handleRowClick(n)}
                  >
                    <TableCell className="py-3 px-4">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="ghost" className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', getCategoryColor(n.category))}>
                        {n.category.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="max-w-[280px]">
                        <span className="text-xs font-semibold text-foreground line-clamp-1">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{n.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="text-xs text-foreground font-medium">{n.user}</span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant="outline" className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border-0', getPriorityColor(n.priority))}>
                        {n.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold', getStatusColor(n.status))}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(n.status))} />
                        {getStatusLabel(n.status)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        onClick={(e) => handleActionClick(e, n)}
                        title={isOrderNotification(n) ? 'Voir la commande' : 'Voir les détails'}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
            <span className="text-[11px] text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg border-border/60"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-semibold px-2 text-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg border-border/60"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
