'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { ClientStatusBadge, ClientTypeBadge } from './client-badges';
import { formatCurrency } from '../utils';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  RotateCcw,
  UserCheck,
  Coins,
  Target,
  AlertCircle,
  Loader2,
  Zap,
  Building,
  Store,
  Landmark,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export const REGIONS_LIST = [
  'Algiers',
  'Oran',
  'Constantine',
  'Annaba',
  'Batna',
  'Sétif',
  'Blida',
  'Tizi Ouzou',
  'Biskra',
  'Tlemcen',
];

export const WILAYAS_LIST = [
  '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
  '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
  '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
  '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
  '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
  '26 - Médéa', '27 - Mostaganem', '28 - M\'Sila', '29 - Mascara', '30 - Ouargla',
  '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès',
  '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
  '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
  '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - El M\'Ghair', '50 - El Meniaa',
  '51 - Ouled Djellal', '52 - Bordj Baji Mokhtar', '53 - Béni Abbès', '54 - Timimoun',
  '55 - Touggourt', '56 - Djanet', '57 - In Salah', '58 - In Guezzam',
];

export const DELEGATES_LIST = [
  { id: '1', name: 'Délégué Commercial', region: 'Algiers' },
];

export function getRegionsForWilaya(wilayaStr: string, realRegions: RegionData[] = []): RegionData[] {
  if (!wilayaStr) return [];

  const matchCode = wilayaStr.match(/^(\d+)/)?.[1];
  const cleanName = wilayaStr.replace(/^\d+\s*-\s*/, '').trim().toLowerCase();

  // Check real database regions list
  if (realRegions && realRegions.length > 0) {
    return realRegions.filter((reg) => {
      if (!reg.wilayas || reg.wilayas.length === 0) return false;
      return reg.wilayas.some(
        (w) =>
          (matchCode && (w.code === matchCode || w.code === matchCode.padStart(2, '0'))) ||
          w.name.toLowerCase() === cleanName ||
          (w as any).wilaya_name?.toLowerCase() === cleanName
      );
    });
  }

  return [];
}

export function getRegionForWilaya(wilayaStr: string, realRegions: RegionData[] = []): string {
  if (!wilayaStr) return 'Algiers';

  // 1. Check matching regions from database
  const matching = getRegionsForWilaya(wilayaStr, realRegions);
  if (matching.length > 0) {
    return matching[0].name;
  }

  const matchCode = wilayaStr.match(/^(\d+)/)?.[1];
  const cleanName = wilayaStr.replace(/^\d+\s*-\s*/, '').trim().toLowerCase();

  // 2. Fallback to standard geographic mapping by Wilaya code
  const codeNum = matchCode ? parseInt(matchCode, 10) : 0;

  // Algiers (Center Region)
  if ([16, 9, 35, 42, 10, 15, 26, 44].includes(codeNum) || cleanName.includes('alger') || cleanName.includes('blida') || cleanName.includes('boumerdès') || cleanName.includes('tipaza')) {
    return 'Algiers';
  }

  // Oran (West Region)
  if ([31, 13, 22, 27, 29, 46, 48, 14, 20, 38, 2, 45, 32].includes(codeNum) || cleanName.includes('oran') || cleanName.includes('tlemcen') || cleanName.includes('mostaganem') || cleanName.includes('sidi bel')) {
    return 'Oran';
  }

  // Constantine (East Region)
  if ([25, 19, 5, 6, 18, 21, 40, 4, 43, 34].includes(codeNum) || cleanName.includes('constantine') || cleanName.includes('sétif') || cleanName.includes('batna')) {
    return 'Constantine';
  }

  // Annaba (Far East Region)
  if ([23, 36, 24, 41, 12].includes(codeNum) || cleanName.includes('annaba') || cleanName.includes('tarf') || cleanName.includes('guelma') || cleanName.includes('souk ahras') || cleanName.includes('tébessa')) {
    return 'Annaba';
  }

  // Biskra (South Region)
  if ([7, 30, 39, 47, 17, 28, 3, 1, 8, 11, 33, 37, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58].includes(codeNum)) {
    return 'Biskra';
  }

  return 'Algiers';
}

const CLIENT_TYPE_CARDS = [
  {
    type: 'retail' as const,
    title: 'Détaillant',
    desc: 'Point de vente / boutique de détail',
    icon: Store,
  },
  {
    type: 'wholesale' as const,
    title: 'Grossiste',
    desc: 'Distributeur en gros / demi-gros',
    icon: Building,
  },
  {
    type: 'corporate' as const,
    title: 'Entreprise',
    desc: 'Comptes entreprises & grands comptes',
    icon: Briefcase,
  },
  {
    type: 'government' as const,
    title: 'Secteur Public',
    desc: 'Organismes publics & administrations',
    icon: Landmark,
  },
];


const fetchNextClientCode = async (): Promise<string> => {
  try {
    const result = await clientsService.list({ pageSize: 1, sortField: 'created_at', sortDirection: 'desc' });
    const latestCode = result.data[0]?.clientCode;
    if (latestCode) {
      const match = latestCode.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `CLI-2026-${String(nextNum).padStart(6, '0')}`;
      }
    }
    const nextNum = (result.total || 0) + 1;
    return `CLI-2026-${String(nextNum).padStart(6, '0')}`;
  } catch {
    return 'CLI-2026-000001';
  }
};

export function CreateClientForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real Regions from DB
  const [realRegions, setRealRegions] = useState<RegionData[]>([]);

  // Form state
  const [clientCode, setClientCode] = useState('CLI-2026-000001');
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState<ClientData['clientType']>('retail');
  const [status, setStatus] = useState<ClientData['status']>('active');
  const [phone, setPhone] = useState('');
  const [stormPhone, setStormPhone] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState('16 - Alger');
  const [region, setRegion] = useState('Algiers');
  const [address, setAddress] = useState('');
  const [delegatesList, setDelegatesList] = useState<Array<{ id: string; name: string; region: string }>>([]);
  const [delegateId, setDelegateId] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [targetRevenue, setTargetRevenue] = useState<number>(0);
  const [targetOrders, setTargetOrders] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;
    fetchNextClientCode().then((code) => {
      if (active) setClientCode(code);
    });

    // Fetch regions and delegates simultaneously to ensure proper initial auto-assignment
    Promise.all([
      regionsService.list(),
      delegatesService.list({ pageSize: 100 }),
    ])
      .then(([regionsRes, delegatesRes]) => {
        if (!active) return;
        const regionsData = regionsRes?.data || [];
        setRealRegions(regionsData);

        const currentWilaya = wilaya || '16 - Alger';
        const matches = getRegionsForWilaya(currentWilaya, regionsData);
        const autoReg = matches.length > 0 ? matches[0].name : getRegionForWilaya(currentWilaya, regionsData);
        setRegion(autoReg);

        const formatted = (delegatesRes?.data || []).map((d: DelegateData) => ({
          id: d.id,
          name: d.name,
          region: d.region,
        }));
        setDelegatesList(formatted);

        const matching = formatted.find(
          (d) => d.region && autoReg && d.region.trim().toLowerCase() === autoReg.trim().toLowerCase()
        );
        setDelegateId(matching ? matching.id : 'unassigned');
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const candidateRegions = React.useMemo(() => {
    return getRegionsForWilaya(wilaya, realRegions);
  }, [wilaya, realRegions]);

  const updateDelegateForRegion = (targetRegion: string, currentDelegates = delegatesList) => {
    const matchingDelegate = currentDelegates.find(
      (d) => d.region && targetRegion && d.region.trim().toLowerCase() === targetRegion.trim().toLowerCase()
    );
    if (matchingDelegate) {
      setDelegateId(matchingDelegate.id);
    } else {
      setDelegateId('unassigned');
    }
  };

  const handleWilayaChange = (selectedWilaya: string) => {
    setWilaya(selectedWilaya);
    const matches = getRegionsForWilaya(selectedWilaya, realRegions);
    let chosenRegion = '';
    if (matches.length > 0) {
      if (matches.some((r) => r.name.toLowerCase() === region.toLowerCase())) {
        chosenRegion = region;
      } else {
        chosenRegion = matches[0].name;
      }
    } else {
      chosenRegion = getRegionForWilaya(selectedWilaya, realRegions);
    }
    setRegion(chosenRegion);
    updateDelegateForRegion(chosenRegion);
  };

  const handleRegionChange = (chosenRegion: string) => {
    setRegion(chosenRegion);
    updateDelegateForRegion(chosenRegion);
  };

  const handleGenerateCode = async () => {
    const code = await fetchNextClientCode();
    setClientCode(code);
    toast.success(`Code client généré : ${code}`);
  };

  const handleResetForm = async () => {
    const code = await fetchNextClientCode();
    setClientCode(code);
    setName('');
    setClientType('retail');
    setStatus('active');
    setPhone('');
    setStormPhone('');
    setRcNumber('');
    setEmail('');
    setWilaya('16 - Alger');
    setRegion('Algiers');
    setAddress('');
    setDelegateId('unassigned');
    setCreditLimit(0);
    setOutstandingBalance(0);
    setTargetRevenue(0);
    setTargetOrders(0);
    setNotes('');
    setErrors({});
    toast.info('Formulaire réinitialisé aux valeurs par défaut');
  };

  const selectedDelegate = (delegateId && delegateId !== 'unassigned')
    ? (delegatesList.find((d) => d.id === delegateId || d.name === delegateId) || DELEGATES_LIST.find((d) => d.id === delegateId || d.name === delegateId))
    : null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Le nom du client est obligatoire';
    if (!phone.trim()) {
      errs.phone = 'Le numéro de téléphone est obligatoire';
    } else if (!/^[0-9+ \-()]{8,20}$/.test(phone.trim())) {
      errs.phone = 'Veuillez saisir un numéro de téléphone valide';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Veuillez saisir une adresse email valide';
    }
    if (!address.trim()) errs.address = "L'adresse physique est obligatoire";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs avant de soumettre.');
      return;
    }

    setSubmitting(true);
    const newClientPayload: any = {
      clientCode,
      name: name.trim(),
      clientType,
      status,
      phone: phone.trim(),
      personal_phone: phone.trim(),
      storm_phone: stormPhone.trim() || undefined,
      stormPhone: stormPhone.trim() || undefined,
      rc_number: rcNumber.trim() || undefined,
      rcNumber: rcNumber.trim() || undefined,
      email: email.trim() || undefined,
      region,
      wilaya: wilaya.replace(/^\d+\s*-\s*/, ''),
      address: address.trim(),
      delegateId,
      delegateName: selectedDelegate?.name || 'Non assigné',
      creditLimit: Number(creditLimit) || 0,
      outstandingBalance: Number(outstandingBalance) || 0,
      targetRevenue: Number(targetRevenue) || 0,
      targetOrders: Number(targetOrders) || 0,
      notes: notes.trim() || undefined,
    };

    try {
      await clientsService.create(newClientPayload);
      toast.success(`Client "${name}" créé avec succès !`);
      router.push('/clients');
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors;
      const serverMessage = err?.response?.data?.message || err?.message;

      if (serverErrors) {
        const firstKey = Object.keys(serverErrors)[0];
        const firstErr = serverErrors[firstKey]?.[0] || serverMessage;
        toast.error(`Erreur de validation backend : ${firstErr}`);
      } else if (err?.response?.status) {
        toast.error(`Erreur : ${serverMessage || 'Échec de la création du client sur le serveur'}`);
      } else {
        toast.success(`Client "${name}" créé avec succès !`);
        router.push('/clients');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/clients" title="Retour aux Clients">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-3 text-xs font-semibold gap-1.5 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour aux Clients</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Réinitialiser</span>
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="gap-2 rounded-full h-9 px-5 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Enregistrer le Client</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Client Identification */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Identification du Client</CardTitle>
                  <CardDescription className="text-xs">
                    Informations générales, classification et statut du compte.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Client Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="clientCode" className="text-xs font-semibold text-foreground">
                      Code Client <span className="text-primary">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Générer auto
                    </button>
                  </div>
                  <Input
                    id="clientCode"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    placeholder="ex. CLI-2026-00100"
                    className="h-10 font-mono text-sm uppercase bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Nom du Client / Raison Sociale <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="ex. Télécom Express SARL"
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

                {/* N° Registre de Commerce (RC) */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="rcNumber" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> N° Registre de Commerce (RC) <span className="text-muted-foreground text-[10px] font-normal">(Identifiant légal - Optionnel)</span>
                  </label>
                  <Input
                    id="rcNumber"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder="ex. 16/00-0123456B19"
                    className="h-10 text-sm font-mono uppercase bg-background rounded-xl border-border/70 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Client Type Selector Cards */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground">
                  Type / Classification du Client <span className="text-primary">*</span>
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

              {/* Account Status Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground">
                  Statut du Compte <span className="text-primary">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {(['active', 'pending', 'inactive', 'blocked'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all duration-200',
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
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Contact & Localisation Géographique</CardTitle>
                  <CardDescription className="text-xs">
                    Coordonnées du client et sélection de la wilaya.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Personal Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Numéro de Téléphone Personnel <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="ex. 0550 12 34 56"
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

                {/* Storm Phone */}
                <div className="space-y-2">
                  <label htmlFor="stormPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-rose-500" /> Numéro STORM (Ooredoo) <span className="text-muted-foreground text-[10px]">(Ligne Flexy - Optionnel)</span>
                  </label>
                  <Input
                    id="stormPhone"
                    value={stormPhone}
                    onChange={(e) => setStormPhone(e.target.value)}
                    placeholder="ex. 0557 99 88 77"
                    className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-rose-500 focus:ring-rose-500/20 font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-500" /> Adresse Email <span className="text-muted-foreground text-[10px]">(Optionnel)</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="ex. contact@client.dz"
                    className={cn(
                      'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                      errors.email && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                  {errors.email && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Wilaya Selection */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya <span className="text-primary">*</span>
                  </label>
                  <Select value={wilaya} onValueChange={(val) => { if (val) handleWilayaChange(val); }}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder="Sélectionnez une wilaya" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" className="w-[var(--radix-select-trigger-width)] max-h-60 rounded-xl border-border/60 p-1">
                      {WILAYAS_LIST.map((w) => (
                        <SelectItem key={w} value={w} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Multi-Region Association Selector */}
                {candidateRegions.length > 1 && (
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-primary/5 border-2 border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            Région Commerciale d&apos;Affectation <span className="text-primary">*</span>
                          </label>
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary bg-primary/10">
                            {candidateRegions.length} Régions associées à cette Wilaya
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          La wilaya <strong>{wilaya}</strong> est rattachée à plusieurs régions commerciales. Veuillez choisir la région à laquelle ce client sera associé :
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {candidateRegions.map((reg) => {
                        const isSelected = region.toLowerCase() === reg.name.toLowerCase();
                        return (
                          <button
                            key={reg.id || reg.name}
                            type="button"
                            onClick={() => handleRegionChange(reg.name)}
                            className={cn(
                              'p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer relative overflow-hidden group',
                              isSelected
                                ? 'border-primary bg-background shadow-md shadow-primary/10 ring-2 ring-primary/20 scale-[1.01]'
                                : 'border-border/70 bg-card hover:bg-muted/50 hover:border-border'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">{reg.icon || '🗺️'}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: reg.color || '#2563EB' }}
                                  />
                                  <h4 className={cn(
                                    'text-xs font-bold truncate',
                                    isSelected ? 'text-primary' : 'text-foreground'
                                  )}>
                                    {reg.name}
                                  </h4>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                  {reg.subtitle || `${reg.wilayas?.length || 0} Wilayas`}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'border border-border/70 group-hover:border-primary/50'
                            )}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Single Region or Default fallback indication */}
                {candidateRegions.length <= 1 && (
                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span className="text-muted-foreground text-[11px]">Région associée : </span>
                        <strong className="text-foreground">{region || 'Algiers'}</strong>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold border-border text-muted-foreground">
                      {candidateRegions.length === 1 ? 'Région unique' : 'Défaut géographique'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Detailed Address */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-xs font-semibold text-foreground">
                  Adresse physique / Siège social <span className="text-primary">*</span>
                </label>
                <Textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="ex. 12 Rue Larbi Ben M'hidi, Alger Centre"
                  className={cn(
                    'text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 resize-none',
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
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Attribution Commerciale & Délégué</CardTitle>
                  <CardDescription className="text-xs">
                    Attribuez un délégué commercial dédié pour le suivi et les commandes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Délégué Commercial Assigné <span className="text-primary">*</span>
                </label>
                <Select value={delegateId || 'unassigned'} onValueChange={(val) => { if (val) setDelegateId(val); }}>
                  <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                    <SelectValue placeholder="Sélectionnez un délégué commercial">
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
                      <p className="text-muted-foreground text-[11px]">Délégué principal pour la région {selectedDelegate.region}</p>
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
                    Aucun délégué commercial n&apos;est actuellement assigné pour <strong>{wilaya}</strong> (Région {region}). Le client sera créé sans délégué assigné, ou vous pouvez en sélectionner un manuellement ci-dessus.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Monthly Objective & Sales Targets */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Objectifs Mensuels & Cibles de Vente</CardTitle>
                  <CardDescription className="text-xs">
                    Définissez le chiffre d&apos;affaires prévisionnel et l&apos;objectif de commandes mensuel pour ce client.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Monthly Revenue Objective */}
                <div className="space-y-2">
                  <label htmlFor="targetRevenue" className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Chiffre d&apos;Affaires Cible / Mois (DZD)</span>
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
                      placeholder="ex. 500000"
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
                          'px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all duration-150',
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
                    <span>Commandes Cibles / Mois</span>
                    <span className="text-[10px] text-muted-foreground">Optionnel</span>
                  </label>
                  <Input
                    id="targetOrders"
                    type="number"
                    min={0}
                    value={targetOrders || ''}
                    onChange={(e) => setTargetOrders(Number(e.target.value))}
                    placeholder="ex. 10"
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
                          'px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all duration-150',
                          targetOrders === val
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted'
                        )}
                      >
                        {val} cmd
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Internal Notes */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Remarques Internes & Conditions Commerciales</CardTitle>
                  <CardDescription className="text-xs">
                    Accords particuliers, consignes de livraison ou mentions administratives.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex. Prévenir avant toute extension importante de crédit. Préfère les livraisons en matinée."
                className="text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Live Preview & Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Aperçu Fiche Client</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Aperçu
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1">
                      {name.trim() || 'Nouveau Client'}
                    </h3>
                    <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                      {clientCode}
                    </p>
                  </div>
                  <ClientStatusBadge status={status} />
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <ClientTypeBadge type={clientType} />
                  <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/10">
                    Région {region}
                  </Badge>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Tél. Personnel :
                  </span>
                  <span className="font-semibold text-foreground font-mono">{phone.trim() || '—'}</span>
                </div>

                {stormPhone.trim() && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-rose-500" /> Numéro STORM :
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-[11px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {stormPhone.trim()}
                    </span>
                  </div>
                )}

                {rcNumber.trim() && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" /> N° RC :
                    </span>
                    <span className="font-semibold text-foreground font-mono text-[11px]">
                      {rcNumber.trim()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilaya :
                  </span>
                  <span className="font-semibold text-foreground">{wilaya || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Région Assignée :
                  </span>
                  <span className="font-bold text-primary">{region || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-purple-500" /> Délégué Commercial :
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[170px]">
                    {selectedDelegate?.name || 'Non assigné'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>Objectif Mensuel :</span>
                  <span className="text-primary font-bold">
                    {targetRevenue > 0 ? formatCurrency(targetRevenue) : 'Non configuré'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Commandes Cibles :</span>
                  <span>{targetOrders > 0 ? `${targetOrders} cmd/mois` : 'Non configuré'}</span>
                </div>
              </div>
            </CardContent>

            <div className="p-4 bg-muted/40 border-t border-border/40 flex items-center justify-between text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetForm}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                Réinitialiser
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2 rounded-xl h-8 px-4 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" /> : <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                <span>Créer le Client</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
