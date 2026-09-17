'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUsersStore } from '../store';
import { toast } from 'sonner';
import { UserPlus, Shield, FileDown, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export function UsersHeader() {
  const { setNewUserDialogOpen } = useUsersStore();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
          <span>Home</span>
          <span>/</span>
          <span className="text-primary font-bold">users</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User & Access Management</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-none text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(), 'dd MMM yyyy')}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full border-border/70 text-xs font-semibold bg-card hover:bg-muted/80"
          onClick={() => toast.success('Role manager opened')}
        >
          <Shield className="h-3.5 w-3.5 mr-1.5" />
          Manage Roles
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full border-border/70 text-xs font-semibold bg-card hover:bg-muted/80"
          onClick={() => toast.success('User list exported')}
        >
          <FileDown className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full border-border/70 text-xs font-semibold bg-card hover:bg-muted/80"
          onClick={() => toast.success('User list refreshed')}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>

        <Link href="/users/new">
          <Button
            size="sm"
            className="h-9 px-4 rounded-full text-xs font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            New User
          </Button>
        </Link>
      </div>
    </div>
  );
}
