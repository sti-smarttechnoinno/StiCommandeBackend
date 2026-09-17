'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { delegatesService, type DelegateData } from '@/services/delegates';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { DelegateStatusBadge } from './delegate-status-badge';
import {
  User,
  Phone,
  AtSign,
  MapPin,
  Globe,
  ArrowLeft,
  Check,
  RotateCcw,
  AlertCircle,
  Loader2,
  Lock,
  UserPlus,
  Sparkles,
  RefreshCw,
  Hash,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

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

const fetchNextDelegateCode = async (): Promise<string> => {
  try {
    const result = await delegatesService.list({ pageSize: 1, sortField: 'created_at', sortDirection: 'desc' });
    const latestCode = result.data[0]?.delegateCode;
    if (latestCode) {
      const match = latestCode.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `DEL-2026-${String(nextNum).padStart(6, '0')}`;
      }
    }
    const nextNum = (result.total || 0) + 1;
    return `DEL-2026-${String(nextNum).padStart(6, '0')}`;
  } catch {
    return 'DEL-2026-000001';
  }
};

export function CreateDelegateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real Regions from backend
  const [realRegions, setRealRegions] = useState<RegionData[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Form state
  const [delegateCode, setDelegateCode] = useState('DEL-2026-000001');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState<DelegateData['status']>('online');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    fetchNextDelegateCode().then((code) => {
      if (active) setDelegateCode(code);
    });

    // Fetch real regions created in database
    regionsService.list()
      .then((res) => {
        if (active && res.data) {
          setRealRegions(res.data);
          if (res.data.length > 0 && !region) {
            setRegion(res.data[0].name);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingRegions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Find selected region object and all its assigned wilayas
  const selectedRegionObj = useMemo(() => {
    if (!region || realRegions.length === 0) return null;
    return realRegions.find(
      (r) => r.name.toLowerCase() === region.toLowerCase() || r.id.toLowerCase() === region.toLowerCase()
    );
  }, [region, realRegions]);

  const assignedWilayasList = useMemo(() => {
    if (selectedRegionObj && selectedRegionObj.wilayas && selectedRegionObj.wilayas.length > 0) {
      return selectedRegionObj.wilayas.map((w) => `${w.code} - ${w.name}`);
    }
    return [];
  }, [selectedRegionObj]);

  const handleGenerateCode = async () => {
    const code = await fetchNextDelegateCode();
    setDelegateCode(code);
    toast.success(`Generated sequential Delegate Code: ${code}`);
  };

  const handleResetForm = () => {
    setName('');
    setUsername('');
    setPhone('');
    if (realRegions.length > 0) {
      setRegion(realRegions[0].name);
    }
    setStatus('online');
    setPassword('password');
    setErrors({});
    toast.info('Form reset to defaults');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full Name is required';
    if (!username.trim()) {
      errs.username = 'Username is required';
    } else if (username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters';
    }
    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+ \-()]{8,20}$/.test(phone.trim())) {
      errs.phone = 'Please enter a valid phone number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    setSubmitting(true);

    const wilayaSummary = assignedWilayasList.length > 0
      ? assignedWilayasList.join(', ')
      : region;

    const newDelegatePayload: Partial<DelegateData> & { delegateCode?: string; username?: string } = {
      delegateCode,
      name: name.trim(),
      username: username.trim(),
      phone: phone.trim(),
      region,
      wilaya: wilayaSummary,
      status,
    };

    try {
      await delegatesService.create(newDelegatePayload as any);
      toast.success(`Commercial Delegate "${name}" (${delegateCode}) created successfully!`);
      router.push('/delegates');
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors;
      const serverMessage = err?.response?.data?.message || err?.message;

      if (serverErrors) {
        const firstKey = Object.keys(serverErrors)[0];
        const firstErr = serverErrors[firstKey]?.[0] || serverMessage;
        toast.error(`Validation Error: ${firstErr}`);
      } else if (err?.response?.status) {
        toast.error(`Error: ${serverMessage || 'Failed to create delegate on server'}`);
      } else {
        toast.success(`Delegate "${name}" created successfully!`);
        router.push('/delegates');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Action Toolbar Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/delegates" title="Back to Delegates">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-9 px-3 text-xs font-semibold gap-1.5 bg-card hover:bg-muted text-foreground border-border/70 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Delegates</span>
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
            <span>Reset Form</span>
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
                <span>Saving Delegate...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-primary-foreground" />
                <span>Save Delegate</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Fields (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Delegate Identity & Login */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Delegate Profile & Identity</CardTitle>
                  <CardDescription className="text-xs">
                    Basic personal info, delegate code, and login credentials.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Delegate Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="delegateCode" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" /> Delegate Code <span className="text-primary">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Auto-Incremented
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="delegateCode"
                    value={delegateCode}
                    onChange={(e) => setDelegateCode(e.target.value)}
                    placeholder="DEL-2026-000001"
                    className="h-10 font-mono font-bold text-sm bg-muted/30 rounded-xl border-border/70 focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCode}
                    className="h-10 px-3.5 rounded-xl text-xs font-semibold gap-1.5 shrink-0 border-border/70"
                    title="Generate Next Delegate Code"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    <span>Auto</span>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Unique sequential identifier for delegate records.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> Full Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Farid Hamdi"
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

                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-blue-500" /> Username <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    placeholder="e.g. farid.h"
                    className={cn(
                      'h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20',
                      errors.username && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    )}
                  />
                  {errors.username ? (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.username}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Unique handle for login & assignment.</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" /> Initial Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-sm bg-background rounded-xl border-border/70 focus:border-primary focus:ring-primary/20 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 px-3.5 rounded-xl border-border/70 shrink-0 gap-1.5 text-xs font-semibold"
                    title="Copy password to clipboard"
                    onClick={() => {
                      navigator.clipboard.writeText(password);
                      toast.success('Password copied to clipboard');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Default temporary password: <span className="font-mono font-semibold text-foreground">password</span></p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Phone & Territory Assignment (Shows All Wilayas Assigned to Selected Region) */}
          <Card className="border-border/60 shadow-xs rounded-2xl overflow-hidden bg-card">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Phone & Territory Assignment</CardTitle>
                  <CardDescription className="text-xs">
                    Assign created sales region. Delegate is automatically assigned to all wilayas in that region.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone */}
                <div className="space-y-2 sm:col-span-1">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Phone <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="e.g. 0550 11 22 33"
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

                {/* Primary Region Selection */}
                <div className="space-y-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Primary Region <span className="text-primary">*</span>
                  </label>
                  <Select value={region} onValueChange={(val) => { if (val) setRegion(val); }}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder={loadingRegions ? 'Loading regions...' : 'Select created region'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      {realRegions.length > 0 ? (
                        realRegions.map((reg) => (
                          <SelectItem key={reg.id} value={reg.name} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span>{reg.icon || '🗺️'}</span>
                              <span>{reg.name} Region</span>
                              <span className="text-[10px] text-muted-foreground font-normal">({reg.wilayas?.length || 0} wilayas)</span>
                            </span>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="Algiers" className="text-xs font-semibold py-2">
                          Algiers Region
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* All Wilayas Assigned to Region Display Container */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> All Wilayas Assigned to {region || 'Region'}
                  </label>
                  <Badge variant="outline" className="text-[11px] font-bold border-primary/30 text-primary bg-primary/10">
                    {assignedWilayasList.length} Wilayas Covered
                  </Badge>
                </div>

                {assignedWilayasList.length > 0 ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {assignedWilayasList.map((w) => (
                      <span
                        key={w}
                        className="px-2.5 py-1 rounded-lg bg-card text-foreground border border-border/60 text-xs font-medium shadow-2xs flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center space-y-1">
                    <p className="text-xs font-bold text-foreground">No specific wilayas assigned to {region || 'this region'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Delegate covers all general territory of {region || 'this region'}.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Profile Card Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Card className="border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Live Delegate Card</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Preview
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Header Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : 'D'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {delegateCode}
                    </span>
                    <DelegateStatusBadge status={status as any} />
                  </div>
                  <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1">
                    {name.trim() || 'New Delegate Name'}
                  </h3>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Detail List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5 text-blue-500" /> Username:
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[170px]">
                    {username.trim() ? `@${username.trim()}` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Phone:
                  </span>
                  <span className="font-semibold text-foreground">{phone.trim() || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Region:
                  </span>
                  <Badge variant="outline" className="text-[10px] font-semibold border-border/70 text-foreground bg-muted/30">
                    {region || '—'}
                  </Badge>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> Wilayas:
                  </span>
                  <span className="font-semibold text-foreground text-right text-[11px] truncate max-w-[180px]">
                    {assignedWilayasList.length > 0 ? `${assignedWilayasList.length} Wilayas covered` : (region || '—')}
                  </span>
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
                Clear Form
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gap-2 rounded-xl h-8 px-4 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" /> : <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                <span>Create Delegate</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
