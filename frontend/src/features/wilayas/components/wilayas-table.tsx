'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useWilayasStore } from '../store';
import { formatCurrency, getPerformanceColor, getPerformanceLabel, getStatusColor, getStatusDot, getStatusLabel } from '../utils';
import { wilayasService } from '@/services/wilayas';
import { WilayaFilters } from './wilaya-filters';
import {
  MapPin, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, MoreHorizontal, TrendingUp, TrendingDown, Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { WilayaRow, SortField } from '../types';

interface WilayasTableProps {
  onViewWilaya: (id: string) => void;
  refreshTrigger?: number;
}

export function WilayasTable({ onViewWilaya, refreshTrigger = 0 }: WilayasTableProps) {
  const { filters, selectedIds, sort, page, pageSize, toggleSelect, selectAll, clearSelection, setSort, setPage, setPageSize } = useWilayasStore();

  const [data, setData] = useState<WilayaRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWilayas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wilayasService.list({
        search: filters.search,
        region: filters.region,
        status: filters.status,
        revenueRange: filters.revenueRange,
        growth: filters.growth,
        sortField: sort.field,
        sortDirection: sort.direction,
        page,
        pageSize,
      });
      setData(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Failed to load wilayas data');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page, pageSize]);

  useEffect(() => {
    fetchWilayas();
  }, [fetchWilayas, refreshTrigger]);

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

  const handleSingleDelete = useCallback(
    async (id: string, name: string) => {
      try {
        await wilayasService.delete(id);
        toast.success(`Deleted ${name}`);
        fetchWilayas();
      } catch {
        toast.error(`Failed to delete ${name}`);
      }
    },
    [fetchWilayas]
  );

  const allPageIds = useMemo(() => data.map((w) => w.id), [data]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAllPage = useCallback(() => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(allPageIds);
    }
  }, [allSelected, allPageIds, selectAll, clearSelection]);

  const columns = useMemo<ColumnDef<WilayaRow>[]>(
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
            aria-label={`Select wilaya ${row.original.name}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-bold font-mono text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md">
            {row.original.code}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'name',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('name')}
          >
            Wilaya Name
            {sort.field === 'name' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            onClick={() => onViewWilaya(row.original.id)}
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {row.original.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-xs block truncate leading-tight group-hover:text-primary transition-colors">
                {row.original.name}
              </span>
              <span className="text-[11px] text-muted-foreground block truncate">
                {row.original.regionName} Region
              </span>
            </div>
          </div>
        ),
        size: 170,
      },
      {
        accessorKey: 'delegate',
        header: 'Assigned Delegate',
        cell: ({ row }) => {
          const d = row.original.delegate;
          if (!d) return <span className="text-xs text-muted-foreground italic">Unassigned</span>;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {d.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-foreground truncate">{d.name}</span>
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'clients',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('clients')}
          >
            Clients
            {sort.field === 'clients' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.original.clients}</span>,
        size: 80,
      },
      {
        accessorKey: 'orders',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('orders')}
          >
            Orders / Mo
            {sort.field === 'orders' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.original.ordersMonth}</span>,
        size: 100,
      },
      {
        accessorKey: 'monthlyRevenue',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('monthlyRevenue')}
          >
            Monthly Revenue
            {sort.field === 'monthlyRevenue' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-xs text-foreground tracking-tight">{formatCurrency(row.original.monthlyRevenue)}</span>
        ),
        size: 130,
      },
      {
        accessorKey: 'growth',
        header: () => (
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
            onClick={() => handleSort('growth')}
          >
            Growth
            {sort.field === 'growth' ? (
              sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const g = row.original.growth;
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                g >= 0 ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' : 'text-rose-600 bg-rose-500/10 dark:text-rose-400'
              )}
            >
              {g >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {g >= 0 ? '+' : ''}{g}%
            </span>
          );
        },
        size: 100,
      },
      {
        accessorKey: 'performance',
        header: 'Performance',
        cell: ({ row }) => (
          <Badge variant="ghost" className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border-none', getPerformanceColor(row.original.performance))}>
            {getPerformanceLabel(row.original.performance)}
          </Badge>
        ),
        size: 110,
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
          <Badge variant="ghost" className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit border-none', getStatusColor(row.original.status))}>
            <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(row.original.status))} />
            <span>{getStatusLabel(row.original.status)}</span>
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onViewWilaya(row.original.id)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onViewWilaya(row.original.id)}>
                  <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> View Performance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info(`Editing ${row.original.name}`)}>
                  <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit Wilaya
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleSingleDelete(row.original.id, row.original.name)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Wilaya
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
    [sort, handleSort, selectedIds, allPageIds, allSelected, someSelected, handleSelectAllPage, toggleSelect, onViewWilaya, handleSingleDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: totalPages,
    state: {
      pagination: { pageIndex: page, pageSize },
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
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Wilayas Performance Directory</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2 py-0.5">
                  {totalCount} Wilayas
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Search, filter, and manage sales performance across Algerian Wilayas
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Integrated Filter Component */}
        <div className="pt-2 border-t border-border/30">
          <WilayaFilters />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto relative min-h-[250px]">
          {loading && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-xs flex items-center justify-center z-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
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
              {table.getRowModel().rows.length > 0 ? (
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
                    No wilayas found matching your filters.
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
              {totalCount > 0 ? page * pageSize + 1 : 0}
            </strong>{' '}
            to{' '}
            <strong className="text-foreground font-semibold">
              {Math.min((page + 1) * pageSize, totalCount)}
            </strong>{' '}
            of <strong className="text-foreground font-semibold">{totalCount}</strong> wilayas
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (page < 3) {
                  pageNum = i;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
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
                    disabled={loading}
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
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1 || loading}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
