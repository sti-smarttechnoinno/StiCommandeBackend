'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useDelegatesStore } from '../store';
import { formatCurrency } from '../utils';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { DelegateStatusBadge } from './delegate-status-badge';
import { DelegateFilters } from './delegate-filters';
import { BulkActions } from './bulk-actions';
import { DelegateProfileDrawer } from './delegate-profile-drawer';
import { EditDelegateDialog } from './edit-delegate-dialog';
import { useWebSocketOrders } from '@/hooks/use-websocket-orders';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Users,
  Eye,
  Pencil,
  ShoppingCart,
  BarChart3,
  Trash2,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SortField } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AVATAR_COLORS = [
  'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
];

export function DelegatesTable() {
  const router = useRouter();
  const { filters, selectedIds, sort, page, pageSize, selectedDelegate, toggleSelect, selectAll, clearSelection, setSort, setPage, setPageSize, setSelectedDelegate } = useDelegatesStore();
  const [delegates, setDelegates] = useState<DelegateData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingDelegate, setEditingDelegate] = useState<DelegateData | null>(null);

  const { lastEvent, lastDelegateEvent } = useWebSocketOrders();

  useEffect(() => {
    if (!lastDelegateEvent) return;

    setDelegates((prev) =>
      prev.map((d) => {
        if (
          d.id === lastDelegateEvent.id ||
          d.name.toLowerCase() === lastDelegateEvent.name.toLowerCase()
        ) {
          return {
            ...d,
            status: lastDelegateEvent.status as any,
            isOnline: lastDelegateEvent.isOnline,
            lastActivity: lastDelegateEvent.lastActivity,
          };
        }
        return d;
      })
    );
  }, [lastDelegateEvent]);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== 'ORDER_CREATED' || !lastEvent.order) return;

    const delegateName = lastEvent.order.delegate_name;
    const amount = Number(lastEvent.order.total_amount || 0);

    setDelegates((prev) =>
      prev.map((d) => {
        if (
          (delegateName && d.name.toLowerCase() === delegateName.toLowerCase()) ||
          (delegateName && d.username && d.username.toLowerCase() === delegateName.toLowerCase())
        ) {
          return {
            ...d,
            totalOrders: (d.totalOrders || 0) + 1,
            totalRevenue: (d.totalRevenue || 0) + amount,
          };
        }
        return d;
      })
    );
  }, [lastEvent]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchDelegates = async () => {
      try {
        const params: Record<string, string | string[] | number> = {};
        if (filters.search) params.search = filters.search;
        if (filters.status.length) params.status = filters.status;
        if (filters.region.length) params.region = filters.region;
        if (filters.dateRange.start) params.dateStart = filters.dateRange.start.toISOString().split('T')[0];
        if (filters.dateRange.end) params.dateEnd = filters.dateRange.end.toISOString().split('T')[0];
        params.sortField = sort.field;
        params.sortDirection = sort.direction;
        params.page = page + 1;
        params.pageSize = pageSize;

        const result = await delegatesService.list(params);
        if (!cancelled) {
          setDelegates(result.data);
          setTotal(result.total);
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load delegates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDelegates();
    const interval = setInterval(fetchDelegates, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filters, sort, page, pageSize]);

  const processedData = useMemo(() => {
    if (filters.performance === 'all') return delegates;
    return delegates.filter((delegate) => {
      const rate = delegate.completionRate ?? 0;
      if (filters.performance === 'excellent') return rate >= 90;
      if (filters.performance === 'good') return rate >= 80 && rate < 90;
      if (filters.performance === 'average') return rate >= 70 && rate < 80;
      if (filters.performance === 'poor') return rate < 70;
      return true;
    });
  }, [delegates, filters.performance]);

  const pageCount = Math.max(1, Math.ceil((processedData.length !== delegates.length ? processedData.length : total) / pageSize));
  const paginatedData = processedData;

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

  const allPageIds = useMemo(() => paginatedData.map((d) => d.id), [paginatedData]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAllPage = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allPageIds);
    }
  }, [allSelected, allPageIds, selectAll, clearSelection]);

  const columns = useMemo<ColumnDef<DelegateData>[]>(
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
            aria-label={`Select delegate ${row.original.name}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'id',
        header: 'Delegate Code',
        cell: ({ row }) => (
          <span className="font-bold font-mono text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md">
            {row.original.delegateCode || `DEL-2026-${String(row.original.id).padStart(6, '0')}`}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'name',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('name')}
          >
            Delegate Name
            {sort.field === 'name' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <Link href={`/delegates/${row.original.id}`} className="flex items-center gap-2.5 min-w-0 cursor-pointer group">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className={cn('text-xs font-bold', AVATAR_COLORS[row.index % AVATAR_COLORS.length])}>
                {row.original.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-xs block truncate leading-tight group-hover:text-primary transition-colors">
                {row.original.name}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {row.original.email}
              </span>
            </div>
          </Link>
        ),
        size: 180,
      },
      {
        accessorKey: 'region',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('region')}
          >
            Region
            {sort.field === 'region' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-md">
            {row.original.region}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'wilaya',
        header: 'Wilaya',
        cell: ({ row }) => <span className="text-xs font-medium text-foreground">{row.original.wilaya}</span>,
        size: 100,
      },
      {
        accessorKey: 'totalOrders',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('totalOrders')}
          >
            Total Orders
            {sort.field === 'totalOrders' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.original.totalOrders}</span>,
        size: 100,
      },
      {
        accessorKey: 'totalRevenue',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('totalRevenue')}
          >
            Total Revenue
            {sort.field === 'totalRevenue' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-xs text-foreground tracking-tight">{formatCurrency(row.original.totalRevenue)}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'completionRate',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('completionRate')}
          >
            Performance
            {sort.field === 'completionRate' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const rate = row.original.completionRate;
          return (
            <div className="space-y-1 min-w-[100px]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-foreground">{rate}%</span>
                <span className={cn(
                  'font-semibold',
                  rate >= 90 ? 'text-emerald-600' : rate >= 80 ? 'text-blue-600' : 'text-amber-600'
                )}>
                  {rate >= 90 ? 'Top' : rate >= 80 ? 'Good' : 'Avg'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    rate >= 90 ? 'bg-emerald-500' : rate >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        },
        size: 120,
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
        cell: ({ row }) => (
          <DelegateStatusBadge
            status={row.original.status}
            lastActivity={row.original.lastActivity}
          />
        ),
        size: 110,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/delegates/${row.original.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="View Profile"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted outline-none cursor-pointer'
                )}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => router.push(`/delegates/${row.original.id}`)}>
                  <BarChart3 className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingDelegate(row.original)}>
                  <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info(`New order for ${row.original.name}`)}>
                  <ShoppingCart className="h-3.5 w-3.5 mr-2 text-blue-600" /> Assign Order
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => toast.error(`Deleted ${row.original.name}`)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Delegate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 70,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [sort, handleSort, selectedIds, allPageIds, allSelected, someSelected, handleSelectAllPage, toggleSelect, setSelectedDelegate]
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
    <>
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full">
        {/* Integrated Combined Header & Filters */}
        <CardHeader className="pb-3 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Delegates Directory</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                    {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    <span>{total} Delegates</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Search, filter, and manage active sales representatives
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Integrated Filter Component */}
          <div className="pt-2 border-t border-border/30">
            <DelegateFilters />
          </div>
        </CardHeader>

        {/* Bulk Actions */}
        <BulkActions />

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
                          <p className="text-xs font-bold text-foreground">Fetching delegates directory...</p>
                          <p className="text-[11px] text-muted-foreground">Loading field sales records and territory data</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0',
                        selectedIds.has(row.original.id) && 'bg-primary/5'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3.5 px-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-xs">
                      No delegates found matching your filters.
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
              of <strong className="text-foreground font-semibold">{processedData.length}</strong> delegates
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

      {/* Delegate Profile Drawer */}
      {selectedDelegate && (
        <DelegateProfileDrawer
          delegateId={selectedDelegate}
          onClose={() => setSelectedDelegate(null)}
        />
      )}

      {/* Edit Delegate Profile Dialog */}
      {editingDelegate && (
        <EditDelegateDialog
          delegate={editingDelegate}
          open={!!editingDelegate}
          onOpenChange={(open) => {
            if (!open) setEditingDelegate(null);
          }}
          onUpdated={(updated) => {
            setDelegates((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setEditingDelegate(null);
          }}
        />
      )}
    </>
  );
}
