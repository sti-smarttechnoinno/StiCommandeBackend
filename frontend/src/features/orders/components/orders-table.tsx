'use client';

import React, { useMemo, useCallback, useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOrdersStore } from '../store';
import { filterOrders, sortOrders, formatCurrency, formatDate } from '../utils';
import { mockOrders } from '../mock-data';
import { OrderStatusBadge } from './order-status-badge';
import { OrderPriorityBadge } from './order-priority-badge';
import { OrderActions } from './order-actions';
import { OrderExpandedRow } from './order-expanded-row';
import { OrderFilters } from './order-filters';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Download,
  Printer,
  Trash2,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocketOrders } from '@/hooks/use-websocket-orders';
import type { ExtendedOrder, SortField } from '../types';
import { ordersService, type OrderData } from '@/services/orders';

export function OrdersTable() {
  const router = useRouter();
  const { filters, selectedIds, expandedIds, sort, page, pageSize, toggleSelect, selectAll, clearSelection, toggleExpand, setSort, setPage, setPageSize } = useOrdersStore();

  const [dbOrders, setDbOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ordersService
      .list({ pageSize: 100 })
      .then((res) => {
        if (active && res.data) {
          const mapped: ExtendedOrder[] = res.data.map((o: any) => {
            const isVirt = o.workflow_type === 'virtual' || o.requires_delivery === false ||
              (o.items && o.items.length > 0 && o.items.every((it: any) => {
                if (it.is_virtual !== undefined) return it.is_virtual;
                const cat = `${it.category || ''} ${it.product_name || ''}`.toLowerCase();
                return cat.includes('credit') || cat.includes('recharge') || cat.includes('mobile_credit');
              }));
            return {
              id: o.id,
              orderNumber: o.order_code || o.orderNumber || '',
              clientId: o.client_id || '',
              clientName: o.client_name || o.clientName || 'Client',
              delegateId: o.delegate_id || '',
              delegateName: (o.delegate_name && o.delegate_name.toLowerCase() !== 'unassigned')
                ? o.delegate_name
                : (o.delegate?.name || o.delegateName || 'Délégué Commercial'),
              region: o.region || '',
              wilaya: o.wilaya || '',
              totalAmount: Number(o.total_amount || o.totalAmount) || 0,
              status: (o.status as any) || 'pending',
              paymentMethod: 'cash',
              priority: 'normal',
              products: (o.items || []).length,
              isVirtual: isVirt,
              createdAt: o.created_at || o.createdAt || new Date().toISOString(),
              updatedAt: o.updated_at || o.updatedAt || new Date().toISOString(),
              items: (o.items || []).map((item: any) => ({
                id: item.id || String(Math.random()),
                productId: item.product_id || item.productId || '',
                productName: item.product_name || item.productName || 'Produit',
                sku: item.reference || item.sku || 'SKU',
                quantity: item.quantity || 1,
                validatedQuantity: item.validated_quantity ?? item.validatedQuantity ?? item.quantity ?? 1,
                unitPrice: Number(item.unit_price || item.unitPrice) || 0,
                totalPrice: Number(item.subtotal || item.totalPrice) || (Number(item.unit_price || item.unitPrice) * (item.quantity || 1)) || 0,
              })),
            };
          });
          setDbOrders(mapped);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const { lastEvent } = useWebSocketOrders();

  useEffect(() => {
    if (lastEvent?.type === 'ORDER_CREATED' && lastEvent.order) {
      const o: any = lastEvent.order;
      const newOrder: ExtendedOrder = {
        id: o.id || String(Math.random()),
        orderNumber: o.order_code || o.orderNumber || '',
        clientId: o.client_id || '',
        clientName: o.client_name || o.clientName || 'Client',
        delegateId: o.delegate_id || '',
        delegateName: (o.delegate_name && o.delegate_name.toLowerCase() !== 'unassigned')
          ? o.delegate_name
          : (o.delegate?.name || o.delegateName || 'Délégué Commercial'),
        region: o.region || '',
        wilaya: o.wilaya || '',
        totalAmount: Number(o.total_amount || o.totalAmount) || 0,
        status: (o.status as any) || 'pending',
        paymentMethod: 'cash',
        priority: 'normal',
        products: (o.items || []).length,
        isVirtual: o.workflow_type === 'virtual' || o.requires_delivery === false ||
          (o.items && o.items.length > 0 && o.items.every((it: any) => {
            if (it.is_virtual !== undefined) return it.is_virtual;
            const cat = `${it.category || ''} ${it.product_name || ''}`.toLowerCase();
            return cat.includes('credit') || cat.includes('recharge') || cat.includes('mobile_credit');
          })),
        createdAt: o.created_at || o.createdAt || new Date().toISOString(),
        updatedAt: o.updated_at || o.updatedAt || new Date().toISOString(),
        items: (o.items || []).map((item: any) => ({
          id: item.id || String(Math.random()),
          productId: item.product_id || item.productId || '',
          productName: item.product_name || item.productName || 'Produit',
          sku: item.reference || item.sku || 'SKU',
          quantity: item.quantity || 1,
          validatedQuantity: item.validated_quantity ?? item.validatedQuantity ?? item.quantity ?? 1,
          unitPrice: Number(item.unit_price || item.unitPrice) || 0,
          totalPrice: Number(item.subtotal || item.totalPrice) || (Number(item.unit_price || item.unitPrice) * (item.quantity || 1)) || 0,
        })),
      };

      setDbOrders((prev) => {
        if (prev.some((existing) => existing.id === newOrder.id || (newOrder.orderNumber && existing.orderNumber === newOrder.orderNumber))) {
          return prev;
        }
        return [newOrder, ...prev];
      });
    }
  }, [lastEvent]);

  const allOrdersList = useMemo(() => {
    return dbOrders;
  }, [dbOrders]);

  const processedData = useMemo(() => {
    const filtered = filterOrders(allOrdersList, filters);
    const sorted = sortOrders(filtered, sort.field, sort.direction);
    return sorted;
  }, [allOrdersList, filters, sort]);

  const pageCount = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sort.field === field) {
        setSort(field, sort.direction === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(field, 'desc');
      }
    },
    [sort, setSort]
  );

  const allPageIds = useMemo(() => paginatedData.map((o) => o.id), [paginatedData]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAllPage = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allPageIds);
    }
  }, [allSelected, allPageIds, selectAll, clearSelection]);

  const handleBulkApprove = () => {
    toast.success(`${selectedIds.size} orders approved`);
    clearSelection();
  };

  const handleBulkDelete = () => {
    toast.error(`${selectedIds.size} orders deleted`);
    clearSelection();
  };

  const columns = useMemo<ColumnDef<ExtendedOrder>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allSelected ? true : someSelected ? false : false}
            onCheckedChange={handleSelectAllPage}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleSelect(row.original.id)}
            aria-label={`Select order ${row.original.id}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'orderNumber',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('orderNumber')}
          >
            Order ID
            {sort.field === 'orderNumber' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const isExpanded = expandedIds.has(row.original.id);
          return (
            <button
              type="button"
              className={cn(
                "font-bold font-mono text-xs px-2.5 py-1 rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs",
                isExpanded
                  ? "bg-primary text-primary-foreground"
                  : "text-primary bg-primary/10 hover:bg-primary/20"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row.original.id);
              }}
            >
              <span>{row.original.orderNumber}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-70" />
              )}
            </button>
          );
        },
        size: 110,
      },
      {
        accessorKey: 'clientName',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('clientName')}
          >
            Client
            {sort.field === 'clientName' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {row.original.clientName.charAt(0)}
            </div>
            <span className="font-semibold text-foreground text-xs leading-tight">
              {row.original.clientName}
            </span>
          </div>
        ),
        size: 160,
      },
      {
        accessorKey: 'delegateName',
        header: 'Delegate',
        cell: ({ row }) => {
          const delegateName =
            row.original.delegateName && row.original.delegateName.toLowerCase() !== 'unassigned'
              ? row.original.delegateName
              : 'Délégué Commercial';

          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {delegateName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {delegateName}
              </span>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-md">
            {row.original.region}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {row.original.items.length} {row.original.items.length === 1 ? 'item' : 'items'}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const totalQty = (row.original.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
          return (
            <span className="font-bold text-xs text-foreground tracking-tight">
              {totalQty}
            </span>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'status',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('status')}
          >
            Status
            {sort.field === 'status' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} isVirtual={row.original.isVirtual} />,
        size: 120,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => <OrderPriorityBadge priority={row.original.priority} />,
        size: 90,
      },
      {
        accessorKey: 'createdAt',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('createdAt')}
          >
            Date
            {sort.field === 'createdAt' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">{formatDate(row.original.createdAt)}</span>
        ),
        size: 80,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <OrderActions
            orderId={row.original.id}
            status={row.original.status}
            onView={(id) => router.push(`/orders/${id}`)}
            onEdit={(id) => router.push(`/orders/${id}/edit`)}
            onApprove={(id) => toast.success(`Order ${id} approved`)}
            onReject={(id) => toast.error(`Order ${id} rejected`)}
            onPrint={(id) => toast.info(`Printing order ${id}`)}
            onDelete={(id) => toast.success(`Order ${id} deleted`)}
            onDuplicate={(id) => toast.info(`Duplicating order ${id}`)}
          />
        ),
        size: 120,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [sort, handleSort, selectedIds, expandedIds, toggleSelect, selectAll, allPageIds, allSelected, someSelected, toggleExpand]
  );

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount,
    state: {
      pagination: { pageIndex: page, pageSize },
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({ pageIndex: page, pageSize }) : updater;
      setPage(newPagination.pageIndex);
      if (newPagination.pageSize !== pageSize) setPageSize(newPagination.pageSize);
    },
    manualPagination: true,
  });

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full">
      {/* Integrated Combined Header & Filters */}
      <CardHeader className="pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Orders List</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{processedData.length} Orders</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Search, filter, and manage all orders in real time
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Integrated Filter Component */}
        <div className="pt-2 border-t border-border/30">
          <OrderFilters />
        </div>
      </CardHeader>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{selectedIds.size} selected</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={clearSelection}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium gap-1.5 text-emerald-600 hover:bg-emerald-500/10" onClick={handleBulkApprove}>
              Approve All
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium gap-1.5" onClick={() => toast.info('Exporting...')}>
              <Download className="h-3 w-3" /> Export
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium gap-1.5" onClick={() => toast.info('Printing...')}>
              <Printer className="h-3 w-3" /> Print
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-b border-border/30">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 px-4"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 py-8">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">Fetching orders directory...</p>
                        <p className="text-[11px] text-muted-foreground">Loading order transactions and distribution records</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const isExpanded = expandedIds.has(row.original.id);
                  const isSelected = selectedIds.has(row.original.id);

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={cn(
                          'hover:bg-muted/40 transition-colors border-b border-border/30 cursor-pointer',
                          isSelected && 'bg-primary/5',
                          isExpanded && 'bg-muted/30 border-b-0'
                        )}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.closest('button') ||
                            target.closest('input') ||
                            target.closest('[role="checkbox"]')
                          ) {
                            return;
                          }
                          toggleExpand(row.original.id);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3.5 px-4 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/30">
                          <TableCell colSpan={columns.length} className="p-0">
                            <OrderExpandedRow
                              order={row.original}
                              onUpdateStatus={(orderId, newStatus, validatedItems) => {
                                setDbOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === orderId
                                      ? {
                                          ...o,
                                          status: newStatus as any,
                                          items: validatedItems
                                            ? o.items.map((item) => ({
                                                ...item,
                                                validatedQuantity: validatedItems[item.id] ?? item.validatedQuantity ?? item.quantity,
                                                total: (validatedItems[item.id] ?? item.validatedQuantity ?? item.quantity) * item.unitPrice,
                                              }))
                                            : o.items,
                                        }
                                      : o
                                  )
                                );
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground text-xs">
                    No orders found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border/30 text-xs">
          <span className="text-muted-foreground">
            Showing{' '}
            <strong className="text-foreground font-semibold">
              {page * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-foreground font-semibold">
              {Math.min((page + 1) * pageSize, processedData.length)}
            </strong>{' '}
            of <strong className="text-foreground font-semibold">{processedData.length}</strong> orders
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                let pageNum: number;
                if (pageCount <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page >= pageCount - 3) {
                  pageNum = pageCount - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-7 w-7 p-0 text-xs font-semibold rounded-md',
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
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
