'use client';

import React, { useMemo, useState, useCallback, useEffect, Fragment } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
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
import { useClientsStore } from '../store';
import { formatCurrency } from '../utils';
import { clientsService, type ClientData } from '@/services/clients';
import { ClientStatusBadge, ClientTypeBadge } from './client-badges';
import { ClientFilters } from './client-filters';
import { ClientExpandedRow } from './client-expanded-row';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Users,
  Eye,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
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

export function ClientsTable() {
  const router = useRouter();
  const {
    filters,
    selectedIds,
    expandedIds,
    sort,
    page,
    pageSize,
    toggleSelect,
    selectAll,
    clearSelection,
    toggleExpand,
    setSort,
    setPage,
    setPageSize,
  } = useClientsStore();

  const [clients, setClients] = useState<ClientData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | string[] | number> = {};

      if (filters.search) params.search = filters.search;
      if (filters.status.length) params.status = filters.status;
      if (filters.region.length) params.region = filters.region;
      if (filters.delegate.length) params.delegate = filters.delegate;
      if (filters.clientType.length) params.clientType = filters.clientType;
      if (filters.dateRange.start) params.dateStart = filters.dateRange.start.toISOString();
      if (filters.dateRange.end) params.dateEnd = filters.dateRange.end.toISOString();
      params.sortField = sort.field === 'delegateName' ? 'region' : sort.field;
      params.sortDirection = sort.direction;
      params.page = page + 1;
      params.pageSize = pageSize;

      const result = await clientsService.list(params);
      setClients(result.data || []);
      setTotal(result.total || 0);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const params: Record<string, string | string[] | number> = {};

        if (filters.search) params.search = filters.search;
        if (filters.status.length) params.status = filters.status;
        if (filters.region.length) params.region = filters.region;
        if (filters.delegate.length) params.delegate = filters.delegate;
        if (filters.clientType.length) params.clientType = filters.clientType;
        if (filters.dateRange.start) params.dateStart = filters.dateRange.start.toISOString();
        if (filters.dateRange.end) params.dateEnd = filters.dateRange.end.toISOString();
        params.sortField = sort.field === 'delegateName' ? 'region' : sort.field;
        params.sortDirection = sort.direction;
        params.page = page + 1;
        params.pageSize = pageSize;

        const result = await clientsService.list(params);
        if (!cancelled) {
          setClients(result.data || []);
          setTotal(result.total || 0);
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load clients');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [filters, sort, page, pageSize]);

  const processedData = clients;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

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

  const allPageIds = useMemo(() => processedData.map((c) => c.id), [processedData]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAllPage = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allPageIds);
    }
  }, [allSelected, allPageIds, selectAll, clearSelection]);

  const handleBulkActivate = async () => {
    try {
      await clientsService.bulkAction(Array.from(selectedIds), 'activate');
      toast.success(`${selectedIds.size} clients activated`);
      clearSelection();
      fetchClients();
    } catch {
      toast.error('Failed to activate selected clients');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await clientsService.bulkAction(Array.from(selectedIds), 'deactivate');
      toast.info(`${selectedIds.size} clients deactivated`);
      clearSelection();
      fetchClients();
    } catch {
      toast.error('Failed to deactivate selected clients');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await clientsService.bulkAction(Array.from(selectedIds), 'delete');
      toast.success(`${selectedIds.size} clients deleted`);
      clearSelection();
      fetchClients();
    } catch {
      toast.error('Failed to delete selected clients');
    }
  };

  const columns = useMemo<ColumnDef<ClientData>[]>(
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
            aria-label={`Select client ${row.original.name}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'clientCode',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('clientCode')}
          >
            Client Code
            {sort.field === 'clientCode' ? (
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
                'font-bold font-mono text-xs px-2.5 py-1 rounded-md transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs',
                isExpanded
                  ? 'bg-primary text-primary-foreground'
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(row.original.id);
              }}
            >
              <span>{row.original.clientCode}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-70" />
              )}
            </button>
          );
        },
        size: 115,
      },
      {
        accessorKey: 'name',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('name')}
          >
            Client
            {sort.field === 'name' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-xs block truncate leading-tight">
                {row.original.name}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {row.original.phone || 'No phone'}
              </span>
            </div>
          </div>
        ),
        size: 170,
      },
      {
        accessorKey: 'clientType',
        header: 'Type',
        cell: ({ row }) => <ClientTypeBadge type={row.original.clientType} />,
        size: 100,
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-md">
            {row.original.region || '-'}
          </span>
        ),
        size: 105,
      },
      {
        accessorKey: 'delegateName',
        header: 'Delegate',
        cell: ({ row }) => {
          const rawName = row.original.delegateName;
          const isUnassigned = !rawName || rawName.trim().toLowerCase() === 'unassigned';

          if (isUnassigned) {
            return (
              <span className="text-xs text-muted-foreground font-medium">
                Unassigned
              </span>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {rawName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {rawName}
              </span>
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: 'totalOrders',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('totalOrders')}
          >
            Orders
            {sort.field === 'totalOrders' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.original.totalOrders || 0}</span>,
        size: 80,
      },
      {
        accessorKey: 'totalSpent',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('totalSpent')}
          >
            Total Spent
            {sort.field === 'totalSpent' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-xs text-foreground tracking-tight">
            {formatCurrency(row.original.totalSpent || 0)}
          </span>
        ),
        size: 115,
      },
      {
        id: 'objectiveProgress',
        header: 'Objective Progress',
        cell: ({ row }) => {
          const obj = row.original.objective;
          const isConfigured = Boolean(obj && obj.isConfigured && obj.targetRevenue > 0);

          if (!isConfigured) {
            return (
              <span className="text-[11px] text-muted-foreground italic">
                There is no objective setted yet
              </span>
            );
          }

          const target = obj!.targetRevenue;
          const achieved = obj!.achievedRevenue;
          const ratio = obj!.revenuePercentage;

          return (
            <div className="space-y-1 min-w-[130px]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-foreground">
                  {formatCurrency(achieved)} / {formatCurrency(target)}
                </span>
                <span className="text-muted-foreground font-semibold">
                  {ratio.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    ratio >= 100
                      ? 'bg-emerald-500'
                      : ratio >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
            </div>
          );
        },
        size: 155,
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
        cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
        size: 110,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/clients/${row.original.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="View Client Profile"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl p-1.5">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/clients/${row.original.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => router.push(`/orders/new?clientId=${row.original.id}`)}>
                  <Plus className="h-3.5 w-3.5" /> New Order
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info(`Editing ${row.original.name}`)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit Client
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                  onClick={async () => {
                    try {
                      await clientsService.delete(row.original.id);
                      toast.success(`Client ${row.original.name} deleted`);
                      fetchClients();
                    } catch {
                      toast.error('Failed to delete client');
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 80,
      },
    ],
    [
      allSelected,
      someSelected,
      selectedIds,
      expandedIds,
      sort,
      handleSelectAllPage,
      toggleSelect,
      toggleExpand,
      handleSort,
      router,
      fetchClients,
    ]
  );

  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      pagination: {
        pageIndex: page,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({ pageIndex: page, pageSize }) : updater;
      setPage(newPagination.pageIndex);
      if (newPagination.pageSize !== pageSize) setPageSize(newPagination.pageSize);
    },
  });

  return (
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
                <CardTitle className="text-base font-bold tracking-tight">Clients List</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{total} Clients</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Search, filter, and manage all client accounts in real time
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Integrated Filter Component */}
        <div className="pt-2 border-t border-border/30">
          <ClientFilters />
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-medium gap-1.5 text-emerald-600 hover:bg-emerald-500/10"
              onClick={handleBulkActivate}
            >
              <CheckCircle2 className="h-3 w-3" /> Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-medium gap-1.5 text-amber-600 hover:bg-amber-500/10"
              onClick={handleBulkDeactivate}
            >
              <XCircle className="h-3 w-3" /> Deactivate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-medium gap-1.5"
              onClick={() => toast.info('Exporting selected clients...')}
            >
              <Download className="h-3 w-3" /> Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto relative">
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
                        <p className="text-xs font-bold text-foreground">Fetching clients directory...</p>
                        <p className="text-[11px] text-muted-foreground">Loading client accounts and distribution records</p>
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
                            target.closest('a') ||
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
                            <ClientExpandedRow client={row.original} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground text-xs">
                    No clients found matching your filters.
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
              {total === 0 ? 0 : page * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-foreground font-semibold">
              {Math.min((page + 1) * pageSize, total)}
            </strong>{' '}
            of <strong className="text-foreground font-semibold">{total}</strong> clients
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
