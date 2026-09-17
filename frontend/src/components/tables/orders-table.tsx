'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateOrders } from '@/constants/mock-data';
import type { Order, OrderStatus } from '@/types';
import { Search, Download, Calendar, RefreshCw, Eye, Pencil, Check, X, Printer, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<OrderStatus, { label: string; style: string; dot: string }> = {
  pending: {
    label: 'Pending',
    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  validated: {
    label: 'Validated',
    style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  preparing: {
    label: 'Preparing',
    style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  delivered: {
    label: 'Delivered',
    style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  rejected: {
    label: 'Rejected',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

import { ordersService, type OrderData } from '@/services/orders';

export function OrdersTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debouncedSearch = useDebounce(search);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersService.list({ search: debouncedSearch, pageSize: 10 });
      setOrders(res.data);
    } catch {
      // Fallback handling if any
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, isRefreshing]);

  const handleRefresh = () => {
    setIsRefreshing((prev) => !prev);
  };

  const columns = useMemo<ColumnDef<OrderData>[]>(
    () => [
      {
        accessorKey: 'order_code',
        header: 'Order ID',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => router.push(`/orders/${row.original.id}`)}
            className="font-semibold font-mono text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded tracking-wider transition-colors cursor-pointer"
            title="View order"
          >
            {row.original.order_code}
          </button>
        ),
      },
      {
        accessorKey: 'client_name',
        header: 'Client',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
              {row.original.client_name ? row.original.client_name.charAt(0) : 'C'}
            </div>
            <span className="font-medium text-foreground text-xs leading-tight">
              {row.original.client_name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'delegate_name',
        header: 'Delegate',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {row.original.delegate_name || 'Unassigned'}
          </span>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded">
            {row.original.region}
          </span>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.items ? row.original.items.length : 1} {row.original.items && row.original.items.length === 1 ? 'item' : 'items'}
          </span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Total Amount',
        cell: ({ row }) => (
          <span className="font-bold text-xs text-foreground tracking-tight">
            {new Intl.NumberFormat('en-US').format(row.original.total_amount)} DA
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const cfg = STATUS_CONFIG[row.original.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
          return (
            <Badge variant="ghost" className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit border-none', cfg.style)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.created_at ? format(new Date(row.original.created_at), 'MMM dd, HH:mm') : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => router.push(`/orders/${row.original.id}`)}
              title="View order"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {row.original.status === 'pending' && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-emerald-600 hover:bg-emerald-500/10">
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-rose-600 hover:bg-rose-500/10">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight">Recent Orders</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5">
                {orders.length} Total
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live transaction log
            </CardDescription>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 w-44 sm:w-52 h-8 text-xs rounded-full bg-muted/50 border-none"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full text-xs font-medium gap-1.5 bg-muted/40 hover:bg-muted/70">
            <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 rounded-full bg-muted/40 hover:bg-muted/70"
            title="Refresh table"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-700", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-b border-border/30">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-4"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground text-xs">
                    No orders matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/30 text-xs">
          <span className="text-muted-foreground">
            Showing{' '}
            <strong className="text-foreground font-semibold">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-foreground font-semibold">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </strong>{' '}
            of <strong className="text-foreground font-semibold">{table.getFilteredRowModel().rows.length}</strong> orders
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                .slice(0, 5)
                .map((page) => (
                  <Button
                    key={page}
                    variant={table.getState().pagination.pageIndex + 1 === page ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-7 w-7 p-0 text-xs font-semibold rounded-md',
                      table.getState().pagination.pageIndex + 1 === page
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Button>
                ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
