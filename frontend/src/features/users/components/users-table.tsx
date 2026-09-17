'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useUsersStore } from '../store';
import { getRoleColor, getRoleLabel, getStatusColor, getStatusDot, getStatusLabel, getAvatarColor } from '../utils';
import { usersService } from '@/services/users';
import type { UserRow } from '../types';
import { toast } from 'sonner';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Users,
} from 'lucide-react';

export function UsersTable() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const {
    searchQuery,
    selectedRoles,
    selectedRegions,
    selectedStatuses,
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
  } = useUsersStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedRoles && selectedRoles.length > 0) params.role = selectedRoles;
      if (selectedStatuses && selectedStatuses.length > 0) params.status = selectedStatuses;
      if (selectedRegions && selectedRegions.length > 0) params.region = selectedRegions;

      const res = await usersService.list(params);
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load users from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRoles, selectedRegions, selectedStatuses]);

  useEffect(() => {
    const handleRefresh = () => fetchUsers();
    window.addEventListener('refresh-users', handleRefresh);
    return () => window.removeEventListener('refresh-users', handleRefresh);
  }, [searchQuery, selectedRoles, selectedRegions, selectedStatuses]);

  const allIds = users.map((u) => u.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedUsers.has(id));

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox checked={allSelected} onCheckedChange={() => selectAllUsers(allIds)} />
        ),
        cell: ({ row }) => (
          <Checkbox checked={selectedUsers.has(row.original.id)} onCheckedChange={() => toggleUserSelection(row.original.id)} />
        ),
        size: 40,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-bold hover:text-foreground" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            User <ArrowUpDown className="h-3 w-3 opacity-40" />
          </button>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/users/${row.original.id}`)}
            title={`View ${row.original.name}'s profile`}
          >
            <Avatar className="h-9 w-9 border border-border/40 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
              <AvatarFallback className={cn('text-xs font-bold', getAvatarColor(row.index))}>
                {row.original.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="block text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {row.original.name}
              </span>
              <span className="block text-[11px] text-muted-foreground">{row.original.email}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'employeeId',
        header: 'Employee ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            {row.original.employeeId}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className={cn('text-[9px] font-semibold px-2.5 py-0.5 rounded-full', getRoleColor(row.original.role))}>
            {getRoleLabel(row.original.role)}
          </span>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground">
            {row.original.region || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline" className={cn('gap-1.5 text-[10px] font-bold border-0', getStatusColor(row.original.status))}>
            <span className={cn('h-1.5 w-1.5 rounded-full', getStatusDot(row.original.status))} />
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'lastLogin',
        header: 'Last Active',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.lastLogin}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={() => router.push(`/users/${row.original.id}`)}
            title={`View ${row.original.name}'s profile`}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View Profile</span>
          </Button>
        ),
        size: 50,
      },
    ],
    [allSelected, allIds, selectedUsers, selectAllUsers, toggleUserSelection, router]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">System User Directory</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {users.length} of {total} registered system users
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Loading users directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground">Try clearing your filters or creating a new user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs font-bold text-muted-foreground">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 border-border/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border/40">
          <span className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 rounded-lg text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 rounded-lg text-xs"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
