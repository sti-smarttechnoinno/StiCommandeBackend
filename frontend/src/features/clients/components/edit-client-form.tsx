'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { clientsService, type ClientData } from '@/services/clients';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { ClientTypeBadge, ClientStatusBadge } from '@/features/clients/components/client-badges';
import {
  WILAYAS_LIST,
  DELEGATES_LIST,
  getRegionForWilaya,
} from '@/features/clients/components/create-client-form';
import { formatCurrency } from '../utils';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Globe,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  RotateCcw,
  UserCheck,
  Target,
  AlertCircle,
  Loader2,
  Store,
  Building,
  Briefcase,
  Landmark,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditClientFormProps {
  clientId: string;
}

const CLIENT_TYPE_CARDS = [
  {
    type: 'retail' as const,
    title: 'Détaillant',
    desc: 'Point de vente / Commerce de détail',
    icon: Store,
  },
  {
    type: 'wholesale' as const,
    title: 'Grossiste',
    desc: 'Distributeur en gros / Demi-gros',
    icon: Building,
  },
  {
    type: 'corporate' as const,
    title: 'Entreprise',
    desc: 'Grands comptes & Sociétés',
    icon: Briefcase,
  },
  {
    type: 'government' as const,
    title: 'Secteur Public',
    desc: 'Établissements publics & État',
    icon: Landmark,
  },
];

export function EditClientForm({ clientId }: EditClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Original Data Backup (for reset)
  const [initialData, setInitialData] = useState<ClientData | null>(null);

  // Real Regions & Delegates from DB
  const [realRegions, setRealRegions] = useState<RegionData[]>([]);
  const [delegatesList, setDelegatesList] = useState<Array<{ id: string; name: string; region: string }>>([]);

  // Form states
  const [clientCode, setClientCode] = useState('');
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState<ClientData['clientType']>('retail');
  const [status, setStatus] = useState<ClientData['status']>('active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState('16 - Alger');
  const [region, setRegion] = useState('Algiers');
  const [address, setAddress] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [targetRevenue, setTargetRevenue] = useState<number>(0);
  const [targetOrders, setTargetOrders] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const [clientRes, regionsRes, delegatesRes, objectivesRes] = await Promise.all([
          clientsService.get(clientId),
          regionsService.list().catch(() => ({ data: [] })),
          delegatesService.list().catch(() => ({ data: [] })),
          clientsService.getObjectives(clientId).catch(() => null),
        ]);

        if (!active) return;

        setInitialData(clientRes);

        // Populate regions & delegates
        const regionsData: RegionData[] = regionsRes?.data || [];
        setRealRegions(regionsData);

        const formattedDelegates = (delegatesRes?.data || []).map((d: DelegateData) => ({
          id: d.id,
          name: d.name,
          region: d.region,
        }));
        setDelegatesList(formattedDelegates);

        // Pre-fill form values
        setClientCode(clientRes.clientCode || `CLI-2026-${clientId.padStart(6, '0')}`);
        setName(clientRes.name || '');
        setClientType(clientRes.clientType || 'retail');
        setStatus(clientRes.status || 'active');
        setPhone(clientRes.phone || '');
        setEmail(clientRes.email || '');
        setWilaya(clientRes.wilaya || '16 - Alger');
        setRegion(clientRes.region || 'Algiers');
        setAddress(clientRes.address || '');
        setDelegateId(clientRes.delegateId ? String(clientRes.delegateId) : 'unassigned');
        setCreditLimit(Number(clientRes.creditLimit || 0));
        setNotes(clientRes.notes || '');

        // Objectives
        if (objectivesRes?.currentMonth?.targetRevenue) {
          setTargetRevenue(Number(objectivesRes.currentMonth.targetRevenue));
          setTargetOrders(Number(objectivesRes.currentMonth.targetOrders || 0));
        } else if (clientRes.objective?.targetRevenue) {
          setTargetRevenue(Number(clientRes.objective.targetRevenue));
        }
      } catch {
        if (active) toast.error('Impossible de charger les données du client');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [clientId]);

  const handleWilayaChange = (selectedWilaya: string | null) => {
    if (!selectedWilaya) return;
    setWilaya(selectedWilaya);
    const autoAssignedRegion = getRegionForWilaya(selectedWilaya, realRegions);
    setRegion(autoAssignedRegion);

    // Auto-select sales delegate matching this region if available
    const matchingDelegate = delegatesList.find(
      (d) => d.region && autoAssignedRegion && d.region.trim().toLowerCase() === autoAssignedRegion.trim().toLowerCase()
    );
    if (matchingDelegate) {
      setDelegateId(matchingDelegate.id);
    } else {
      setDelegateId('unassigned');
    }
  };

  const handleGenerateCode = async () => {
    try {
      const result = await clientsService.list({ pageSize: 1, sortField: 'created_at', sortDirection: 'desc' });
      const latestCode = result.data[0]?.clientCode;
      if (latestCode) {
        const match = latestCode.match(/(\d+)$/);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          const code = `CLI-2026-${String(nextNum).padStart(6, '0')}`;
          setClientCode(code);
          toast.success(`Code client généré : ${code}`);
          return;
        }
      }
      const nextNum = (result.total || 0) + 1;
      const code = `CLI-2026-${String(nextNum).padStart(6, '0')}`;
      setClientCode(code);
      toast.success(`Code client généré : ${code}`);
    } catch {
      setClientCode(`CLI-2026-${clientId.padStart(6, '0')}`);
    }
  };

  const handleResetToInitial = () => {
    if (!initialData) return;
    setClientCode(initialData.clientCode || `CLI-2026-${clientId.padStart(6, '0')}`);
    setName(initialData.name || '');
    setClientType(initialData.clientType || 'retail');
    setStatus(initialData.status || 'active');
    setPhone(initialData.phone || '');
    setEmail(initialData.email || '');
    setWilaya(initialData.wilaya || '16 - Alger');
    setRegion(initialData.region || 'Algiers');
    setAddress(initialData.address || '');
    setDelegateId(initialData.delegateId ? String(initialData.delegateId) : 'unassigned');
    setCreditLimit(Number(initialData.creditLimit || 0));
    setNotes(initialData.notes || '');
    setErrors({});
    toast.info('Données réinitialisées aux valeurs sauvegardées');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Le nom du client / raison sociale est obligatoire';
    if (!phone.trim()) newErrors.phone = 'Le numéro de téléphone est obligatoire';
    if (!wilaya) newErrors.wilaya = 'Veuillez sélectionner une Wilaya';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientCode: clientCode.trim() || undefined,
        name: name.trim(),
        clientType,
        status,
        phone: phone.trim(),
        email: email.trim() || undefined,
        wilaya,
        region,
        address: address.trim(),
        delegateId: delegateId === 'unassigned' || !delegateId ? null : delegateId,
        creditLimit: creditLimit > 0 ? creditLimit : undefined,
        notes: notes.trim() || undefined,
        targetRevenue: targetRevenue > 0 ? targetRevenue : undefined,
        targetOrders: targetOrders > 0 ? targetOrders : undefined,
      };

      await clientsService.update(clientId, payload);
      toast.success(`Fiche client de ${name} mise à jour avec succès`);
      router.push(`/clients/${clientId}`);
      router.refresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Échec de la mise à jour du client';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const avatarInitials = (name || 'Client')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const selectedDelegate = delegatesList.find((d) => d.id === delegateId) ||
    (DELEGATES_LIST.find((d) => d.id === delegateId));

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Chargement des données du client...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Action Bar - Exactly matching clients/new styling & size */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href={`/clients/${clientId}`} title="Retour à la fiche client">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-3 text-xs font-semibold gap-1.5 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à la fiche client</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToInitial}
            disabled={submitting}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Rétablir</span>
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="gap-2 rounded-full h-9 px-5 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Client Identification - Identical to clients/new */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Identification du client</CardTitle>
                  <CardDescription className="text-xs">
                    Identification de base, classification du client et statut du compte.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Client Code */}
                <div className="space-y-2">
                  <div className="h-5 flex items-center justify-between">
                    <label htmlFor="clientCode" className="text-xs font-semibold text-foreground flex items-center gap-1 leading-none">
                      Code client <span className="text-primary">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer leading-none"
                    >
                      <Sparkles className="h-3 w-3" /> Générer auto
                    </button>
                  </div>
                  <Input
                    id="clientCode"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    placeholder="ex: CLI-2026-000100"
                    className="h-10 font-mono text-sm uppercase bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <div className="h-5 flex items-center">
                    <label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1 leading-none">
                      Nom du client / Raison sociale <span className="text-primary">*</span>
                    </label>
                  </div>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="ex: Ets Pharmacie Centrale SARL"
                    className={cn(
                      'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                      errors.name && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                  {errors.name && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Client Type Selector Cards - Exact same card of type as clients/new */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground">
                  Type de client / Classification <span className="text-primary">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CLIENT_TYPE_CARDS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = clientType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setClientType(item.type)}
                        className={cn(
                          'flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                            : 'border-border/60 bg-background/60 hover:bg-muted/50 hover:border-border'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg mb-2',
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Status Selection - Exact same as clients/new */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground">
                  Statut du compte <span className="text-primary">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(['active', 'pending', 'inactive', 'blocked'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all duration-200 cursor-pointer',
                        status === st
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-2xs'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted/60'
                      )}
                    >
                      <ClientStatusBadge status={st} />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Contact & Location Information */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-blue-500/10 via-blue-500/[0.03] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Coordonnées & Localisation géographique</CardTitle>
                  <CardDescription className="text-xs">
                    Saisissez les coordonnées de contact et sélectionnez la Wilaya.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Numéro de téléphone <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="ex: 0550 12 34 56"
                    className={cn(
                      'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                      errors.phone && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                  {errors.phone && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-500" /> Adresse email <span className="text-muted-foreground text-[10px]">(Optionnel)</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="ex: contact@client.dz"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Wilaya Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya <span className="text-primary">*</span>
                  </label>
                  <Select value={wilaya} onValueChange={handleWilayaChange}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder="Sélectionner une Wilaya" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-xl border-border/60">
                      {WILAYAS_LIST.map((w) => (
                        <SelectItem key={w} value={w} className="text-xs py-2 cursor-pointer">
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-detected Region Badge */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Région commerciale <span className="text-muted-foreground text-[10px]">(Auto-déduite)</span>
                  </label>
                  <div className="h-10 px-3.5 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Région {region}</span>
                    <Badge variant="outline" className="rounded-full text-[10px] font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                      Automatique
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" /> Adresse physique / Siège social <span className="text-muted-foreground text-[10px]">(Optionnel)</span>
                </label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="ex: 12 Rue Didouche Mourad, Alger Centre"
                  className={cn(
                    'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                    errors.address && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                  )}
                />
                {errors.address && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.address}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Commercial & Delegate Assignment */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-purple-500/10 via-purple-500/[0.03] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Délégué commercial & Suivi client</CardTitle>
                  <CardDescription className="text-xs">
                    Assigner un délégué commercial dédié responsable des commandes et du suivi client.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Délégué commercial assigné
                </label>
                <Select value={delegateId || 'unassigned'} onValueChange={(val) => { if (val) setDelegateId(val); }}>
                  <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                    <SelectValue placeholder="Sélectionner un délégué commercial">
                      {selectedDelegate ? `${selectedDelegate.name} (Région ${selectedDelegate.region})` : 'Aucun délégué assigné (Non assigné)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60 p-1">
                    <SelectItem value="unassigned" className="text-xs font-semibold py-2 rounded-lg cursor-pointer text-amber-600 bg-amber-500/10 mb-1">
                      🚫 Aucun délégué assigné (Non assigné)
                    </SelectItem>
                    {(delegatesList.length > 0 ? delegatesList : DELEGATES_LIST).map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                        {d.name} (Région {d.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDelegate ? (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {selectedDelegate.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedDelegate.name}</p>
                      <p className="text-muted-foreground text-[11px]">Délégué commercial pour {selectedDelegate.region}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px] font-semibold border-primary/30 text-primary bg-primary/5">
                    Assigné
                  </Badge>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-[11px] leading-relaxed">
                    Aucun délégué commercial n&apos;est actuellement assigné pour <strong>{wilaya}</strong> (Région {region}). Le client sera enregistré sans délégué assigné.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Monthly Objective & Sales Targets */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Objectifs mensuels & Quotas de vente</CardTitle>
                  <CardDescription className="text-xs">
                    Définissez le chiffre d&apos;affaires cible et le quota de commandes mensuel pour ce client.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Monthly Revenue Objective */}
                <div className="space-y-2">
                  <label htmlFor="targetRevenue" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Chiffre d&apos;affaires cible / Mois (DZD)</span>
                    <span className="text-[10px] text-muted-foreground">Optionnel</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="targetRevenue"
                      type="number"
                      min={0}
                      step={50000}
                      value={targetRevenue || ''}
                      onChange={(e) => setTargetRevenue(Number(e.target.value))}
                      placeholder="ex: 500000"
                      className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-medium pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                      DA
                    </div>
                  </div>
                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">Préréglages :</span>
                    {[250000, 500000, 1000000, 2000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTargetRevenue(val)}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all duration-150 cursor-pointer',
                          targetRevenue === val
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
                        )}
                      >
                        {val >= 1000000 ? `${val / 1000000}M DA` : `${val / 1000}k DA`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Target Orders */}
                <div className="space-y-2">
                  <label htmlFor="targetOrders" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Commandes cibles / Mois</span>
                    <span className="text-[10px] text-muted-foreground">Optionnel</span>
                  </label>
                  <Input
                    id="targetOrders"
                    type="number"
                    min={0}
                    value={targetOrders || ''}
                    onChange={(e) => setTargetOrders(Number(e.target.value))}
                    placeholder="ex: 10"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-medium"
                  />
                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium mr-1">Préréglages :</span>
                    {[5, 10, 20, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTargetOrders(val)}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all duration-150 cursor-pointer',
                          targetOrders === val
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
                        )}
                      >
                        {val} commandes
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Credit Limit */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label htmlFor="creditLimit" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Plafond de crédit accordé (DZD)</span>
                  <span className="text-[10px] text-muted-foreground">Optionnel</span>
                </label>
                <div className="relative">
                  <Input
                    id="creditLimit"
                    type="number"
                    min={0}
                    step={100000}
                    value={creditLimit || ''}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    placeholder="ex: 1000000"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 font-medium pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    DA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Internal Notes */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card pt-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-slate-500/10 via-slate-500/[0.03] to-transparent p-6 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Notes internes & Conditions commerciales</CardTitle>
                  <CardDescription className="text-xs">
                    Accords particuliers, consignes de livraison ou remarques administratives.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Préavis requis avant toute augmentation de crédit. Préfère les livraisons en matinée."
                className="text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Sidebar (4 cols) - Matches create-client-form exactly */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md pt-0 pb-0 gap-0">
            <CardHeader className="bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent p-5 pb-4 border-b border-border/40 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Aperçu de la fiche client</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Aperçu
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5 flex-1">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-base">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-foreground leading-snug line-clamp-1">
                        {name || 'Nom du client'}
                      </p>
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 inline-block">
                        {clientCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <ClientStatusBadge status={status} />
                  <ClientTypeBadge type={clientType} />
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Téléphone :
                  </span>
                  <span className="font-semibold text-foreground">{phone || '—'}</span>
                </div>

                {email && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" /> Email :
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[170px]">{email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Région :
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                    {region}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya :
                  </span>
                  <span className="font-semibold text-foreground">{wilaya}</span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-purple-500" /> Délégué :
                  </span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[150px]">
                    {selectedDelegate ? selectedDelegate.name : 'Non assigné'}
                  </span>
                </div>

                {creditLimit > 0 && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/30">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      Plafond crédit :
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(creditLimit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Target Highlight */}
              {(targetRevenue > 0 || targetOrders > 0) && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary block">
                    Objectif Mensuel Cible
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Chiffre d&apos;affaires :</span>
                    <span className="font-extrabold text-foreground text-xs">
                      {targetRevenue > 0 ? formatCurrency(targetRevenue) : 'Non défini'}
                    </span>
                  </div>
                  {targetOrders > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Commandes cibles :</span>
                      <span className="font-extrabold text-foreground text-xs">
                        {targetOrders} cmd / mois
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Sidebar Footer with Action Buttons */}
            <CardFooter className="p-4 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs rounded-b-2xl mt-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToInitial}
                disabled={submitting}
                className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
              >
                Rétablir
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2 rounded-xl h-8 px-4 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                )}
                <span>Enregistrer les modifications</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  );
}
