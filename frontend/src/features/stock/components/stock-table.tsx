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
import { cn } from '@/lib/utils';
import { useStockStore } from '../store';
import { formatDateTime, getMovementTypeColor, getMovementTypeLabel, getStatusColor, getStatusLabel, getStatusDot, getQuantityColor, getQuantityPrefix } from '../utils';
import { stockService } from '@/services/stock';
import { StockToolbar } from './stock-toolbar';
import {
  Package, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Printer, Pencil, RotateCcw, MoreHorizontal, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { StockMovement, SortField } from '../types';

export function StockTable() {
  const {
    filters,
    selectedIds,
    sort,
    page,
    pageSize,
    refreshTrigger,
    toggleSelect,
    selectAll,
    clearSelection,
    setSort,
    setPage,
    setPageSize,
  } = useStockStore();

  const [data, setData] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    stockService
      .list({
        search: filters.search || undefined,
        warehouse: filters.warehouse.length ? filters.warehouse : undefined,
        movementType: filters.movementType.length ? filters.movementType : undefined,
        delegate: filters.delegate.length ? filters.delegate : undefined,
        status: filters.status.length ? filters.status : undefined,
        dateStart: filters.dateRange.start ? filters.dateRange.start.toISOString() : undefined,
        dateEnd: filters.dateRange.end ? filters.dateRange.end.toISOString() : undefined,
        sortField: sort.field,
        sortDirection: sort.direction,
        page,
        pageSize,
      })
      .then((res) => {
        if (active) {
          setData(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages || Math.ceil(res.total / pageSize) || 1);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, sort, page, pageSize, refreshTrigger]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sort.field === field) {
        setSort(field, sort.direction === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(field, field === 'date' ? 'desc' : 'asc');
      }
    },
    [sort, setSort]
  );

  const allPageIds = useMemo(() => data.map((m) => m.id), [data]);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAllPage = useCallback(() => {
    if (allSelected) clearSelection();
    else selectAll(allPageIds);
  }, [allSelected, allPageIds, selectAll, clearSelection]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors font-bold"
      onClick={() => handleSort(field)}
    >
      {children}
      {sort.field === field ? (
        sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  const columns = useMemo<ColumnDef<StockMovement>[]>(
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
            aria-label={`Select ${row.original.reference}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'reference',
        header: () => <SortHeader field="reference">Reference</SortHeader>,
        cell: ({ row }) => (
          <span className="font-bold font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
            {row.original.reference}
          </span>
        ),
        size: 130,
      },
      {
        accessorKey: 'product',
        header: () => <SortHeader field="product">Product</SortHeader>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">{row.original.product}</span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'movementType',
        header: () => <SortHeader field="movementType">Type</SortHeader>,
        cell: ({ row }) => (
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold', getMovementTypeColor(row.original.movementType))}>
            <span className={cn('w-1.5 h-1.5 rounded-full', row.original.movementType === 'incoming' ? 'bg-emerald-500' : row.original.movementType === 'outgoing' ? 'bg-rose-500' : row.original.movementType === 'transfer' ? 'bg-blue-500' : 'bg-amber-500')} />
            {getMovementTypeLabel(row.original.movementType)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'quantity',
        header: () => <SortHeader field="quantity">Quantity</SortHeader>,
        cell: ({ row }) => (
          <span className={cn('text-xs font-bold', getQuantityColor(row.original.movementType, row.original.quantity))}>
            {getQuantityPrefix(row.original.movementType)}{row.original.quantity.toLocaleString()}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'warehouse',
        header: () => <SortHeader field="warehouse">Warehouse</SortHeader>,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-2 py-0.5 rounded-md">
            {row.original.warehouse}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'delegate',
        header: () => <SortHeader field="delegate">Delegate</SortHeader>,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">{row.original.delegate}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'status',
        header: () => <SortHeader field="status">Status</SortHeader>,
        cell: ({ row }) => (
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold', getStatusColor(row.original.status))}>
            <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(row.original.status))} />
            {getStatusLabel(row.original.status)}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'date',
        header: () => <SortHeader field="date">Date & Time</SortHeader>,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">{formatDateTime(row.original.date)}</span>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => toast.info(`View ${row.original.reference}`)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => toast.info(`Print ${row.original.reference}`)}>
              <Printer className="h-3.5 w-3.5" />
            </Button>
            {row.original.status === 'pending' && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => toast.info(`Edit ${row.original.reference}`)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
        size: 100,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [sort, handleSort, selectedIds, toggleSelect, selectAll, allPageIds, allSelected, someSelected]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: totalPages,
    manualPagination: true,
  });

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full">
      <CardHeader className="pb-3 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Stock Movements</CardTitle>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {loading ? '...' : `${total} Records`}
                </span>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Track all incoming, outgoing, transfer, and adjustment operations
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-border/30">
          <StockToolbar />
        </div>
      </CardHeader>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{selectedIds.size} selected</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={clearSelection}>
              Clear
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-medium gap-1.5" onClick={() => toast.info('Exporting selected...')}>
              Export
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
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Loading stock movements...</span>
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
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground text-xs">
                    No stock movements found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-t border-border/30 text-xs">
          <span className="text-muted-foreground">
            Showing <strong className="text-foreground font-semibold">{total > 0 ? page * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-foreground font-semibold">{Math.min((page + 1) * pageSize, total)}</strong> of{' '}
            <strong className="text-foreground font-semibold">{total}</strong> movements
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page <= 0 || loading}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i;
                else if (page < 3) pageNum = i;
                else if (page >= totalPages - 3) pageNum = totalPages - 5 + i;
                else pageNum = page - 2 + i;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className={cn('h-7 w-7 p-0 text-xs font-semibold rounded-md', page === pageNum ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
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
