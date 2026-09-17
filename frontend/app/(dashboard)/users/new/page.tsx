'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersService } from '@/services/users';
import { rolesService, type RoleData } from '@/services/roles';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { getRoleColor, getRoleLabel, getStatusColor, getStatusLabel, getStatusDot } from '@/features/users/utils';
import {
  Calendar,
  UserPlus,
  User,
  UserCheck,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Building2,
  Lock,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_PASSWORD = 'Sti2026!';

export default function NewUserPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('Friday, July 31, 2026');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Options
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('commercial');
  const [region, setRegion] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [department, setDepartment] = useState('Commercial Operations');
  const [status, setStatus] = useState('authorized');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

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
      if (rolesData?.length) {
        setRole(rolesData[0].slug);
      }
      if (regionList?.length) {
        setRegion(regionList[0].name);
      }
    });
  }, []);

  const selectedRoleObj = roles.find((r) => r.slug === role);
  const requiresRegion = selectedRoleObj?.has_region_restriction || role === 'commercial' || role === 'delegate';

  if (!mounted) return null;

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!usernameEdited) {
      const clean = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '.');
      setUsername(clean);
    }
  };

  const handleReset = () => {
    setFullName('');
    setUsername('');
    setUsernameEdited(false);
    setEmail('');
    setPhone('');
    setEmployeeId('');
    setRole(roles.length ? roles[0].slug : 'commercial');
    setRegion(regions.length ? regions[0].name : '');
    setWilaya('');
    setDepartment('Commercial Operations');
    setStatus('authorized');
    setPassword(DEFAULT_PASSWORD);
    setShowPassword(false);
    setForcePasswordChange(true);
    toast.info('Formulaire réinitialisé aux valeurs par défaut');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Veuillez renseigner le nom complet');
      return;
    }

    if (!username.trim()) {
      toast.error('Veuillez renseigner un nom d\'utilisateur (identifiant de connexion)');
      return;
    }

    if (!role) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    if (role === 'commercial' && !region.trim()) {
      toast.error('Le rôle Commercial nécessite obligatoirement l\'assignation d\'une région territoriale');
      return;
    }

    setSubmitting(true);

    try {
      await usersService.create({
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        role: role as any,
        region: role === 'commercial' ? (region.trim() || undefined) : undefined,
        wilaya: undefined,
        password: password.trim() || undefined,
        status: status as any,
      });

      toast.success('Compte utilisateur créé avec succès !', {
        description: `${fullName} (${username}) a été enregistré avec le rôle ${selectedRoleObj?.name || role}.`,
      });

      router.push('/users');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Échec de la création du compte';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const avatarInitials = fullName.trim()
    ? fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'NU';

  return (
    <RoleGuard requiredPermission="users.manage">
      <div className="space-y-8 pb-10">
      {/* Top Breadcrumb & Page Banner */}
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
                <BreadcrumbLink href="/users/new" className="text-foreground text-xs font-semibold capitalize">
                  New User
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Add New User Account
              </h1>
              <p className="text-sm text-muted-foreground">
                Onboard new platform user (Administrator, Manager, or Viewer) into STI system.
              </p>
            </div>
          </div>
        </div>

        {/* Date Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground bg-card/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/70 shadow-xs">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Main 2-Column Grid (8 cols Left + 4 cols Right Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Cards (8 cols) */}
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
                    onChange={(e) => handleFullNameChange(e.target.value)}
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
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameEdited(true);
                    }}
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
                    placeholder="ex: k.benziane@sti.dz (facultatif)"
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

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-purple-500" /> Matricule Employé (Optionnel)
                  </label>
                  <Input
                    placeholder="EMP-2026-000001 (Auto-généré si laissé vide)"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="h-11 rounded-xl text-xs border-border/60 bg-background font-mono max-w-md"
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
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      {selectedRoleObj?.has_region_restriction
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
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Le compte sera actif dès sa création.
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5 shrink-0" /> Le compte sera verrouillé et ne pourra pas se connecter.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Territory & Geographic Scope (Only for Commercial role) */}
            {role === 'commercial' && (
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
                  <div className="space-y-2 max-w-md">
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
                </CardContent>
              </Card>
            )}

            {/* Card 3: Security & Password */}
            <Card className="border border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Security & Initial Password</CardTitle>
                    <CardDescription className="text-xs">Set temporary login password and force first login change policy.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-rose-500" /> Temporary Password
                    </label>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-primary/10 text-primary border-primary/20">
                      Default: {DEFAULT_PASSWORD}
                    </Badge>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="!h-11 rounded-xl text-xs border-border/60 bg-background pr-10 font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>Assigned initial password: <code className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{DEFAULT_PASSWORD}</code></span>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(DEFAULT_PASSWORD);
                        toast.success(`Reset to default password: ${DEFAULT_PASSWORD}`);
                      }}
                      className="text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 max-w-md">
                  <Checkbox
                    id="forcePass"
                    checked={forcePasswordChange}
                    onCheckedChange={(val) => setForcePasswordChange(val === true)}
                  />
                  <label htmlFor="forcePass" className="text-xs font-semibold text-foreground cursor-pointer">
                    Force user to change password on first login
                  </label>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Right Column: Live User Preview Sidebar (4 cols sticky) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">User Live Preview</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/10">
                  Draft Preview
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
                    {fullName.trim() || 'New User'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {employeeId.trim() || 'EMP-2026-AUTO'}
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
                    {role === 'commercial' ? (region || 'Non assigné') : 'Portée Nationale'}
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
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Statut d&apos;Accès :
                  </span>
                  <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", getStatusColor(status as any))}>
                    {status === 'authorized' ? '✓ Autorisé' : '✕ Bloqué'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Rôle :
                  </span>
                  <span className="font-semibold text-foreground capitalize">
                    {selectedRoleObj?.name || role}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !fullName.trim() || !username.trim() || !role || (role === 'commercial' && !region.trim())}
                  className="w-full h-11 rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary-foreground" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User Account
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
                  Reset Form
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
