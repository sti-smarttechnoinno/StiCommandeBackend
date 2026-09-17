'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { RoleGuard } from '@/components/auth/role-guard';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersService } from '@/services/users';
import { rolesService, type RoleData } from '@/services/roles';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import type { UserRow } from '@/features/users/types';
import { getRoleColor, getRoleLabel, getStatusColor, getStatusLabel, getStatusDot } from '@/features/users/utils';
import {
  Calendar,
  User,
  UserCheck,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  MapPin,
  Save,
  KeyRound,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Users as UsersIcon,
  Monitor,
  Smartphone,
  Clock,
  Check,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  login: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  logout: <Clock className="h-4 w-4 text-muted-foreground" />,
  password_changed: <KeyRound className="h-4 w-4 text-amber-500" />,
  role_updated: <Shield className="h-4 w-4 text-blue-500" />,
  failed_login: <XCircle className="h-4 w-4 text-rose-500" />,
};

const SYSTEM_MODULES = [
  { name: 'Dashboard', desc: 'Analytics, KPI metrics and activity tracking', perms: ['Read', 'Export'] },
  { name: 'Orders Management', desc: 'Create, validate, modify and process orders', perms: ['Read', 'Create', 'Update', 'Validate'] },
  { name: 'Clients Directory', desc: 'Customer profiles, territories and limits', perms: ['Read', 'Create', 'Update'] },
  { name: 'Products & Catalog', desc: 'Product inventory, telecom pricing and stock', perms: ['Read', 'Manage'] },
  { name: 'Stock Operations', desc: 'Warehouses, transfers and movements', perms: ['Read', 'Manage'] },
  { name: 'Reports & Export', desc: 'Financial, commercial and executive reports', perms: ['Read', 'Export'] },
  { name: 'User Management', desc: 'Staff accounts, roles and permission controls', perms: ['Read', 'Manage'] },
  { name: 'System Settings', desc: 'Platform configurations, operators and categories', perms: ['Manage'] },
];

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Original fetched user
  const [user, setUser] = useState<UserRow | null>(null);

  // Dynamic Options
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('commercial');
  const [region, setRegion] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [department, setDepartment] = useState('Commercial Operations');
  const [status, setStatus] = useState('authorized');

  const populateUserData = (data: UserRow) => {
    setUser(data);
    setFullName(data.name || '');
    setUsername(data.username || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setEmployeeId(data.employeeId || '');
    setRole(data.role || 'commercial');
    setRegion(data.region || '');
    setWilaya(data.wilaya || '');
    setDepartment(data.department || 'Commercial Operations');
    setStatus(data.status || 'authorized');
  };

  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await usersService.get(id);
      populateUserData(data);
    } catch {
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(format(new Date(), 'EEEE, MMMM d, yyyy'));

    Promise.all([
      rolesService.list().catch(() => []),
      regionsService.list().catch(() => ({ data: [] })),
    ]).then(([rolesData, regionsResp]) => {
      setRoles(rolesData || []);
      const regionList = (regionsResp && 'data' in regionsResp ? regionsResp.data : []) as RegionData[];
      setRegions(regionList);
    });

    loadUser();
  }, [loadUser]);

  const selectedRoleObj = roles.find((r) => r.slug === role);
  const requiresRegion = selectedRoleObj?.has_region_restriction || role === 'commercial' || role === 'delegate';

  const handleReset = () => {
    if (user) {
      populateUserData(user);
      toast.info('Formulaire réinitialisé aux valeurs actuelles de l\'utilisateur');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toast.error('Veuillez renseigner le nom complet');
      return;
    }

    if (!username.trim()) {
      toast.error('Veuillez renseigner un nom d\'utilisateur');
      return;
    }

    if (!role) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    if (role === 'commercial' && !region.trim()) {
      toast.error('Le rôle Commercial nécessite obligatoirement l\'assignation d\'une région');
      return;
    }

    setSubmitting(true);

    try {
      const updated = await usersService.update(user.id, {
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        role: role as any,
        region: role === 'commercial' ? (region.trim() || undefined) : undefined,
        wilaya: wilaya.trim() || undefined,
        department: department.trim() || undefined,
        status: status as any,
        isActive: status !== 'blocked',
      } as any);

      toast.success('Profil utilisateur mis à jour avec succès !', {
        description: `Les modifications pour ${fullName} ont été enregistrées.`,
      });

      if (updated) {
        populateUserData(updated);
      } else {
        await loadUser();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Échec de la mise à jour';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = status === 'blocked' ? 'authorized' : 'blocked';
    setActionLoading(true);
    try {
      await usersService.update(user.id, {
        status: newStatus,
        isActive: newStatus === 'authorized',
      } as any);
      setStatus(newStatus);
      toast.success(
        newStatus === 'authorized'
          ? `Le compte de "${fullName}" est maintenant autorisé.`
          : `Le compte de "${fullName}" a été bloqué.`
      );
      await loadUser();
    } catch {
      toast.error('Échec de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = () => {
    if (!user) return;
    toast.success(`Instructions de réinitialisation envoyées à ${email || fullName}`);
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    if (!window.confirm(`Êtes-vous certain de vouloir supprimer définitivement le compte "${fullName}" ?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await usersService.delete(user.id);
      toast.success(`Compte "${fullName}" supprimé avec succès`);
      router.push('/users');
    } catch {
      toast.error('Échec de la suppression de l\'utilisateur');
      setActionLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement du profil utilisateur...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Utilisateur Introuvable</h2>
        <p className="text-xs text-muted-foreground">Le profil utilisateur demandé n'existe pas ou a été retiré.</p>
        <Link href="/users">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste des utilisateurs
          </Button>
        </Link>
      </div>
    );
  }

  const avatarInitials = fullName.trim()
    ? fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const isCommercial = role === 'commercial' || role === 'delegate';

  return (
    <RoleGuard requiredPermission="users.manage">
      <div className="space-y-8 pb-10">
        {/* Top Breadcrumb & Page Banner (Identical to /users/new) */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/users" className="text-muted-foreground text-xs capitalize hover:text-foreground transition-colors">
                    Users
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/users/${user.id}`} className="text-foreground text-xs font-semibold capitalize">
                    {fullName || 'User Profile'}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {fullName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gérer les informations, autorisations, affectation territoriale et sécurité du collaborateur.
                </p>
              </div>
            </div>
          </div>

          {/* Date Badge & Top Directory Link */}
          <div className="flex items-center gap-3">
            <Link href="/users">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Users Directory</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid (8 cols Left + 4 cols Right Sidebar, identical to /users/new) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Cards & Tabs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Personal Information */}
              <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Personal Information</CardTitle>
                      <CardDescription className="text-xs">User contact details and identification credentials.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" /> Nom et Prénom *
                    </label>
                    <Input
                      required
                      placeholder="ex: Karim Benziane"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-500" /> Identifiant de Connexion (Username) *
                    </label>
                    <Input
                      required
                      placeholder="ex: karim.benziane"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Identifiant requis utilisé pour se connecter à l&apos;application.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Adresse Courriel (Optionnel)
                    </label>
                    <Input
                      type="email"
                      placeholder="ex: k.benziane@sti.dz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" /> Numéro de Téléphone
                    </label>
                    <Input
                      placeholder="ex: 0550 11 22 33"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" /> Matricule Employé
                    </label>
                    <Input
                      placeholder="EMP-2026-000001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" /> Département
                    </label>
                    <Input
                      placeholder="ex: Commercial Operations"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-11 rounded-xl text-xs border-border/60 bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Role & Access Control */}
              <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Rôle & Contrôle d&apos;Accès</CardTitle>
                      <CardDescription className="text-xs">Définissez les privilèges du collaborateur et autorisez ou bloquez son accès.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Selector 1: Role */}
                    <div className="space-y-2 w-full">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between h-5">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>Rôle Système</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        {selectedRoleObj?.has_region_restriction && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            📍 Portée Régionale
                          </span>
                        )}
                      </label>
                      <Select value={role} onValueChange={(v) => setRole(v ?? 'commercial')}>
                        <SelectTrigger className="!h-12 rounded-xl border-border/70 hover:border-primary/50 text-xs sm:text-sm bg-background w-full px-4 font-semibold flex items-center justify-between shadow-xs transition-all">
                          <SelectValue placeholder="Choisir un rôle système" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70 shadow-xl p-1">
                          {roles.length > 0 ? (
                            roles.map((r) => (
                              <SelectItem
                                key={r.id}
                                value={r.slug}
                                className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3 rounded-lg hover:bg-muted/80 my-0.5"
                              >
                                {r.name} {r.has_region_restriction ? '• 📍 Portée Régionale' : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="admin" className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3">
                                Administrateur (Accès National Complet)
                              </SelectItem>
                              <SelectItem value="charge_compte" className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3">
                                Chargé de Compte (Consultation & MAJ)
                              </SelectItem>
                              <SelectItem value="commercial" className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3">
                                Commercial (Restreint Région)
                              </SelectItem>
                              <SelectItem value="delegate" className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3">
                                Délégué Commercial
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        {selectedRoleObj?.has_region_restriction || role === 'commercial'
                          ? 'Accès limité aux commandes et clients du territoire assigné.'
                          : 'Accès national à toutes les opérations autorisées.'}
                      </p>
                    </div>

                    {/* Selector 2: Account Status */}
                    <div className="space-y-2 w-full">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between h-5">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Statut du Compte</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          status === 'authorized'
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        )}>
                          {status === 'authorized' ? 'Connexion Autorisée' : 'Connexion Bloquée'}
                        </span>
                      </label>
                      <Select value={status} onValueChange={(v) => setStatus(v ?? 'authorized')}>
                        <SelectTrigger className="!h-12 rounded-xl border-border/70 hover:border-primary/50 text-xs sm:text-sm bg-background w-full px-4 font-semibold flex items-center justify-between shadow-xs transition-all">
                          <SelectValue placeholder="Choisir le statut" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70 shadow-xl p-1">
                          <SelectItem
                            value="authorized"
                            className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3 rounded-lg hover:bg-emerald-500/10 my-0.5 text-emerald-600"
                          >
                            🟢 Autorisé (Peut se connecter)
                          </SelectItem>
                          <SelectItem
                            value="blocked"
                            className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3 rounded-lg hover:bg-rose-500/10 my-0.5 text-rose-600"
                          >
                            🔴 Bloqué (Connexion refusée)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground pt-0.5">
                        {status === 'authorized' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Le compte est actif et opérationnel.
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5 shrink-0" /> Le compte est verrouillé et ne peut pas se connecter.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Territory & Geographic Scope */}
              {(role === 'commercial' || requiresRegion) && (
                <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span>Territoire & Région</span>
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                              Obligatoire pour Commercial
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Affectez le commercial à sa région d&apos;intervention exclusive.
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        <strong>Portée Restreinte :</strong> Ce commercial aura un accès strict et exclusif aux commandes et clients de la région choisie ci-dessous.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 h-5">
                          <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Région Principale</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <Select value={region} onValueChange={(v) => setRegion(v || '')}>
                          <SelectTrigger className="!h-12 rounded-xl border-border/70 hover:border-primary/50 text-xs sm:text-sm bg-background w-full px-4 font-semibold shadow-xs transition-all">
                            <SelectValue placeholder="Choisir une région" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/70 shadow-xl p-1">
                            {regions.map((reg) => (
                              <SelectItem
                                key={reg.id}
                                value={reg.name}
                                className="text-xs sm:text-sm font-medium cursor-pointer py-2.5 px-3 rounded-lg hover:bg-muted/80 my-0.5"
                              >
                                <span className="font-semibold text-foreground">{reg.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 h-5">
                          <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Wilaya d'Attache</span>
                        </label>
                        <Input
                          placeholder="ex: Alger, Oran, Constantine..."
                          value={wilaya}
                          onChange={(e) => setWilaya(e.target.value)}
                          className="!h-12 rounded-xl text-xs sm:text-sm border-border/70 bg-background px-4 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Quick navigation to Commercial's Orders & Clients */}
                    <div className="pt-2 flex items-center gap-3">
                      <Link href={`/orders?search=${encodeURIComponent(fullName)}`} className="flex-1">
                        <Button type="button" variant="outline" size="sm" className="w-full text-xs font-semibold h-10 rounded-xl bg-background border-border/70 hover:bg-muted">
                          <ShoppingBag className="h-3.5 w-3.5 mr-2 text-primary" /> Commandes du Commercial
                        </Button>
                      </Link>
                      <Link href={`/clients?search=${encodeURIComponent(fullName)}`} className="flex-1">
                        <Button type="button" variant="outline" size="sm" className="w-full text-xs font-semibold h-10 rounded-xl bg-background border-border/70 hover:bg-muted">
                          <UsersIcon className="h-3.5 w-3.5 mr-2 text-primary" /> Clients du Commercial
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>

            {/* Tabs for Permissions, Devices, and Audit Logs */}
            <Tabs defaultValue="permissions" className="w-full flex flex-col space-y-4">
              <TabsList className="bg-muted/50 p-1.5 rounded-2xl w-full justify-start gap-1 border border-border/40 shrink-0">
                <TabsTrigger value="permissions" className="text-xs font-bold rounded-xl px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <Shield className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Privilèges & Modules
                </TabsTrigger>
                <TabsTrigger value="devices" className="text-xs font-bold rounded-xl px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <Monitor className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Appareils Actifs ({(user.devices || []).length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs font-bold rounded-xl px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs">
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  Journal d&apos;Audit ({(user.loginHistory || []).length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Permissions */}
              <TabsContent value="permissions" className="w-full space-y-4">
                <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">Permissions Système & Privilèges d'Accès</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Modules accessibles selon le rôle "{selectedRoleObj?.name || getRoleLabel(role as any)}".
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={cn('text-xs font-bold px-2.5 py-1 rounded-full', getRoleColor(role as any))}>
                        {getRoleLabel(role as any)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30 text-xs">
                      {SYSTEM_MODULES.map((mod) => (
                        <div key={mod.name} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground">{mod.name}</h4>
                            <p className="text-[11px] text-muted-foreground">{mod.desc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {mod.perms.map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20 px-2 py-0.5"
                              >
                                <Check className="h-2.5 w-2.5 mr-1 text-primary" /> {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Devices */}
              <TabsContent value="devices" className="w-full space-y-4">
                <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                    <CardTitle className="text-base font-bold">Appareils Enregistrés & Sessions Actives</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Sessions et périphériques autorisés sur ce compte.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {(user.devices && user.devices.length > 0) ? (
                      user.devices.map((dev, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              {dev.type === 'Desktop' ? <Monitor className="h-5 w-5 text-blue-500" /> : <Smartphone className="h-5 w-5 text-emerald-500" />}
                            </div>
                            <div>
                              <span className="font-bold text-foreground text-sm block">{dev.browser}</span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <MapPin className="h-3 w-3 text-amber-500" /> {dev.location} · <span className="font-mono">{dev.ip}</span>
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                            {dev.lastActive}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">Aucun appareil connecté actif enregistré.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Activity Log */}
              <TabsContent value="activity" className="w-full space-y-4">
                <Card className="border border-border/60 shadow-xs rounded-2xl bg-card overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                    <CardTitle className="text-base font-bold">Journal d&apos;Audit & Événements de Sécurité</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Historique chronologique des connexions et altérations de statut.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {(user.loginHistory && user.loginHistory.length > 0) ? (
                      user.loginHistory.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-background text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                              {EVENT_ICONS[ev.type] || <Clock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div>
                              <span className="font-bold text-foreground block capitalize">{ev.type.replace(/_/g, ' ')}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {ev.device} · {ev.ipAddress}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[9px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                              {ev.status}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{ev.timestamp}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">Aucun historique d&apos;audit disponible.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Live User Preview Sidebar (4 cols sticky, strictly identical to /users/new) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold text-foreground">Aperçu Utilisateur</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/10">
                    ID #{user.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Avatar & Main Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-primary/15 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-bold">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground leading-tight">
                      {fullName.trim() || 'User Profile'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {employeeId.trim() || user.employeeId || 'EMP-2026-AUTO'}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {(selectedRoleObj?.name || getRoleLabel(role as any)) ? (
                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", getRoleColor(role as any))}>
                          {selectedRoleObj?.name || getRoleLabel(role as any)}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className={cn("text-[10px] font-bold capitalize gap-1", getStatusColor(status as any))}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', getStatusDot(status as any))} />
                        {getStatusLabel(status as any)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/40 w-full" />

                {/* Summary Details */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-500" /> Identifiant :
                    </span>
                    <span className="font-mono font-bold text-foreground truncate max-w-[160px]">
                      {username.trim() || 'username'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Courriel :
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[160px]">
                      {email.trim() || 'Non renseigné'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-500" /> Territoire :
                    </span>
                    <span className="font-semibold text-foreground">
                      {isCommercial ? (region || 'Non assigné') : 'Portée Nationale'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" /> Téléphone :
                    </span>
                    <span className="font-semibold text-foreground">
                      {phone.trim() || 'Non renseigné'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-500" /> Département :
                    </span>
                    <span className="font-semibold text-foreground">
                      {department || 'Commercial Operations'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Statut d&apos;Accès :
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", getStatusColor(status as any))}>
                      {status === 'authorized' ? '✓ Autorisé' : '✕ Bloqué'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" /> Rôle :
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {selectedRoleObj?.name || getRoleLabel(role as any)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Dernier Accès :
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {user.lastLogin || 'Jamais connecté'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={submitting || !fullName.trim() || !username.trim() || !role || (role === 'commercial' && !region.trim())}
                    className="w-full h-11 rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary-foreground" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les Modifications
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="w-full h-10 rounded-xl font-semibold text-xs border-border/70 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                    Réinitialiser
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetPassword}
                      className="h-9 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground border-border/70"
                    >
                      <KeyRound className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                      Mot de passe
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleToggleStatus}
                      className={cn(
                        'h-9 rounded-xl text-[11px] font-semibold border-border/70',
                        status === 'blocked' ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-amber-600 hover:bg-amber-500/10'
                      )}
                    >
                      {status === 'blocked' ? (
                        <>
                          <Unlock className="h-3.5 w-3.5 mr-1.5" />
                          Débloquer
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Bloquer
                        </>
                      )}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleDeleteUser}
                    className="w-full h-9 rounded-xl text-[11px] font-semibold text-rose-600 hover:bg-rose-500/10 mt-1"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer ce compte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
