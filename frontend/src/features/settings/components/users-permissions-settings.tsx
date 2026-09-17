'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { rolesService, type RoleData, type PermissionModule } from '@/services/roles';
import { usersService } from '@/services/users';
import type { UserRow } from '@/features/users/types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  MapPin,
  Globe,
  Plus,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Search,
  UserCheck,
  Building2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function UsersPermissionsSettings() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRegionRestriction, setFormRegionRestriction] = useState(false);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, modulesData, usersResp] = await Promise.all([
        rolesService.list(),
        rolesService.getModules(),
        usersService.list({ pageSize: 10 }),
      ]);
      setRoles(rolesData);
      setModules(modulesData);
      setUsers(usersResp.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur lors du chargement des rôles et permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormRegionRestriction(false);
    setFormPermissions(['orders.view', 'clients.view', 'products.view']);
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: RoleData) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormSlug(role.slug);
    setFormDescription(role.description || '');
    setFormRegionRestriction(role.has_region_restriction);
    setFormPermissions(role.permissions || []);
    setIsDialogOpen(true);
  };

  const togglePermission = (permKey: string) => {
    setFormPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const toggleModulePermissions = (module: PermissionModule) => {
    const moduleKeys = module.permissions.map((p) => p.key);
    const allSelected = moduleKeys.every((k) => formPermissions.includes(k));

    if (allSelected) {
      // Remove all
      setFormPermissions((prev) => prev.filter((k) => !moduleKeys.includes(k)));
    } else {
      // Add missing
      setFormPermissions((prev) => Array.from(new Set([...prev, ...moduleKeys])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Le nom du rôle est obligatoire.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await rolesService.update(editingRole.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          has_region_restriction: formRegionRestriction,
          permissions: formPermissions,
        });
        toast.success(`Le rôle "${formName}" a été mis à jour avec succès.`);
      } else {
        await rolesService.create({
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          description: formDescription.trim(),
          has_region_restriction: formRegionRestriction,
          permissions: formPermissions,
        });
        toast.success(`Le rôle "${formName}" a été créé avec succès.`);
      }

      setIsDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleData) => {
    if (role.is_system) {
      toast.error('Les rôles système ne peuvent pas être supprimés.');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ?`)) {
      return;
    }

    try {
      await rolesService.delete(role.id);
      toast.success(`Rôle "${role.name}" supprimé.`);
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression.';
      toast.error(msg);
    }
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  // Statistics summary
  const totalUsersCount = useMemo(() => {
    return roles.reduce((acc, r) => acc + (r.users_count || 0), 0);
  }, [roles]);

  const regionalRolesCount = useMemo(() => {
    return roles.filter((r) => r.has_region_restriction).length;
  }, [roles]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/40 shadow-xs bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rôles Définis
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {roles.length} <span className="text-xs font-normal text-muted-foreground">rôles</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xs bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rôles Régionaux
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {regionalRolesCount} <span className="text-xs font-normal text-muted-foreground">restreints</span>
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-xs bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Utilisateurs Rattachés
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {totalUsersCount} <span className="text-xs font-normal text-muted-foreground">comptes</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Roles Management Card */}
      <Card className="border border-border/40 shadow-xs rounded-2xl">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-primary" />
                <span>Gestion des Rôles & Permissions</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Définissez les privilèges d&apos;accès, les capacités de validation et les restrictions territoriales par rôle.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrer les rôles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-9 w-44 sm:w-56 text-xs rounded-full bg-background"
                />
              </div>
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouveau Rôle</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des rôles et privilèges...</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm font-medium">Aucun rôle trouvé.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredRoles.map((role) => {
                const permsCount = role.permissions?.length || 0;
                return (
                  <div
                    key={role.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground">{role.name}</h4>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                          {role.slug}
                        </span>
                        {role.is_system ? (
                          <Badge variant="secondary" className="text-[10px] font-semibold gap-1 py-0 rounded-full">
                            <Lock className="h-2.5 w-2.5" /> Système
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold py-0 rounded-full">
                            Personnalisé
                          </Badge>
                        )}
                        {role.has_region_restriction ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold gap-1 py-0 rounded-full">
                            <MapPin className="h-2.5 w-2.5" /> Région Restreinte (Commercial)
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold gap-1 py-0 rounded-full">
                            <Globe className="h-2.5 w-2.5" /> Portée Nationale
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {role.description || 'Aucune description spécifiée pour ce rôle.'}
                      </p>

                      {/* Permissions Summary Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-bold text-foreground mr-1">
                          {permsCount} privilège{permsCount > 1 ? 's' : ''} accordé{permsCount > 1 ? 's' : ''} :
                        </span>
                        {role.permissions?.slice(0, 4).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/30"
                          >
                            {p}
                          </span>
                        ))}
                        {permsCount > 4 && (
                          <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40">
                            +{permsCount - 4} autres
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center flex-shrink-0">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-foreground">
                          {role.users_count || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">utilisateurs</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                          className="h-8 px-3 rounded-full text-xs font-semibold gap-1.5 border-border/70 hover:bg-muted"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Configurer</span>
                        </Button>
                        {!role.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role)}
                            className="h-8 w-8 rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Supprimer ce rôle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Users Management & Directory Link */}
      <Card className="border border-border/40 shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              <span>Attribution des Rôles aux Utilisateurs</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Associez vos collaborateurs (Commerciaux, Chargés de comptes, Magasiniers) à leurs rôles et régions.
            </CardDescription>
          </div>
          <Link href="/users">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full h-8 px-3.5 font-semibold text-xs border-border/70 hover:bg-muted"
            >
              <span>Accéder à l&apos;annuaire</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-muted-foreground">Collaborateur</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Identifiant</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Rôle Assigné</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Territoire & Région</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 5).map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <p className="font-semibold text-xs text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email || user.phone || 'Pas de courriel'}</p>
                    </TableCell>
                    <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">
                      {user.employeeId || user.username || `ID-${user.id}`}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="font-semibold text-xs capitalize bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {user.region ? (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          {user.region} {user.wilaya ? `(${user.wilaya})` : ''}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] font-bold rounded-full py-0.5 px-2',
                          user.status === 'online'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {user.status === 'online' ? 'Actif' : 'Hors ligne'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>{editingRole ? `Modifier le Rôle "${editingRole.name}"` : 'Créer un Nouveau Rôle'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configurez les attributs du rôle, son périmètre géographique et ses autorisations granulaires.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* General Role Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Nom du Rôle <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="ex: Chargé de Compte, Commercial Ouest..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Identifiant Technique (Slug)
                </label>
                <Input
                  type="text"
                  placeholder="ex: charge_compte, commercial..."
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  disabled={Boolean(editingRole?.is_system)}
                  className="h-9 text-xs rounded-xl font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Généré automatiquement si laissé vide.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">Description</label>
                <Textarea
                  placeholder="Détaillez les missions et attributions prévues pour ce rôle..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="text-xs rounded-xl resize-none"
                />
              </div>
            </div>

            {/* Regional Scoping Switch */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-foreground">
                    Restreindre aux Données Régionales (Portée Commerciale)
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Lorsque cette option est activée, l&apos;utilisateur associé à ce rôle (ex: Commercial) ne pourra{' '}
                  <strong>voir et gérer que les commandes et les clients de la région et wilayas qui lui sont affectées</strong>.
                  Il n&apos;aura pas accès aux données des autres régions.
                </p>
              </div>
              <Switch
                checked={formRegionRestriction}
                onCheckedChange={setFormRegionRestriction}
                className="data-[state=checked]:bg-amber-600"
              />
            </div>

            {/* Granular Permission Matrix by Module */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Matrice des Droits d&apos;Accès & Permissions
                </h4>
                <span className="text-[11px] font-semibold text-primary">
                  {formPermissions.length} permission{formPermissions.length > 1 ? 's' : ''} activée{formPermissions.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {modules.map((mod) => {
                  const modKeys = mod.permissions.map((p) => p.key);
                  const allModSelected = modKeys.every((k) => formPermissions.includes(k));
                  const someModSelected = modKeys.some((k) => formPermissions.includes(k));

                  return (
                    <div
                      key={mod.id}
                      className="border border-border/40 rounded-2xl p-4 bg-muted/20 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border/30">
                        <div>
                          <h5 className="font-bold text-xs text-foreground flex items-center gap-2">
                            <span>{mod.name}</span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              ({mod.permissions.filter((p) => formPermissions.includes(p.key)).length}/{mod.permissions.length})
                            </span>
                          </h5>
                          <p className="text-[10px] text-muted-foreground">{mod.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleModulePermissions(mod)}
                          className="text-[11px] h-7 px-2.5 font-semibold text-primary hover:bg-primary/10"
                        >
                          {allModSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {mod.permissions.map((perm) => {
                          const isChecked = formPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={cn(
                                'flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left',
                                isChecked
                                  ? 'bg-primary/5 border-primary/30 text-foreground'
                                  : 'bg-card border-border/30 text-muted-foreground hover:border-border/60'
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm.key)}
                                className="mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <p className="text-xs font-semibold leading-none text-foreground">
                                  {perm.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full text-xs font-semibold h-9 px-4"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 rounded-full text-xs font-bold h-9 px-5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingRole ? 'Enregistrer les Modifications' : 'Créer le Rôle'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
