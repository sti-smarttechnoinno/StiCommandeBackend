'use client';

import { useState, useMemo } from 'react';
import { Search, Check, Users, UserCheck, Shield, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AssignableUser } from '@/services/objectives';

interface AssignableUserPickerProps {
  users: AssignableUser[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function AssignableUserPicker({
  users,
  selectedIds,
  onChange,
  disabled = false,
}: AssignableUserPickerProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'commercial' | 'delegate'>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.region_name && u.region_name.toLowerCase().includes(search.toLowerCase()));

      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'commercial' && (u.role === 'commercial' || u.role === 'responsable_commercial')) ||
        (roleFilter === 'delegate' && u.role === 'delegate');

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.includes(u.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect only those in filtered list
      const filteredIds = new Set(filteredUsers.map((u) => u.id));
      onChange(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all in filtered list
      const combined = new Set([...selectedIds, ...filteredUsers.map((u) => u.id)]);
      onChange(Array.from(combined));
    }
  };

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
      case 'directeur':
        return 'Directeur';
      case 'responsable_commercial':
        return 'Resp. Commercial';
      case 'commercial':
        return 'Commercial';
      case 'delegate':
        return 'Délégué';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'directeur':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
      case 'responsable_commercial':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'commercial':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'delegate':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/50 bg-muted/20 p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Collaborateurs concernés
          </span>
          <Badge variant="secondary" className="font-mono text-xs rounded-full bg-primary/15 text-primary border-primary/20 font-bold px-2 py-0">
            {selectedIds.length} sélectionné(s)
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs rounded-full font-medium text-muted-foreground hover:text-foreground"
            onClick={toggleSelectAll}
            disabled={disabled || filteredUsers.length === 0}
          >
            <UserCheck className="mr-1 h-3.5 w-3.5 text-primary" />
            {allFilteredSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs rounded-full text-muted-foreground hover:text-foreground border-border/60"
              onClick={() => onChange([])}
              disabled={disabled}
            >
              <X className="mr-1 h-3 w-3" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Search and Role Filter Chips */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher par nom, email, région..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
            disabled={disabled}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-3 text-xs rounded-full font-medium transition-colors border',
              roleFilter === 'all'
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
            )}
            onClick={() => setRoleFilter('all')}
          >
            Tous ({users.length})
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-3 text-xs rounded-full font-medium transition-colors border',
              roleFilter === 'commercial'
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
            )}
            onClick={() => setRoleFilter('commercial')}
          >
            Commerciaux
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-3 text-xs rounded-full font-medium transition-colors border',
              roleFilter === 'delegate'
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
            )}
            onClick={() => setRoleFilter('delegate')}
          >
            Délégués
          </Button>
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="h-56 rounded-xl border border-border/50 bg-background/50 p-1.5">
        {filteredUsers.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Users className="h-6 w-6 stroke-1 text-muted-foreground/50" />
            <p className="font-medium">Aucun collaborateur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id);
              const initials = user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={user.id}
                  onClick={() => !disabled && toggleUser(user.id)}
                  className={cn(
                    'group flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition-all',
                    isSelected
                      ? 'border-primary/40 bg-primary/5 shadow-xs dark:bg-primary/10'
                      : 'border-border/40 hover:border-border hover:bg-muted/50',
                    disabled && 'pointer-events-none opacity-60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 text-xs">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-[11px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate text-foreground">{user.name}</span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                            getRoleBadgeVariant(user.role)
                          )}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {user.region_name && (
                          <span className="flex items-center gap-0.5 truncate font-medium text-foreground/80">
                            <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            {user.region_name}
                          </span>
                        )}
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 group-hover:border-primary/50'
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
