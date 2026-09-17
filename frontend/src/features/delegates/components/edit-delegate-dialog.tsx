'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { delegatesService, type DelegateData, type UpdateDelegateParams } from '@/services/delegates';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { DelegateStatusBadge } from './delegate-status-badge';
import { toast } from 'sonner';
import {
  Pencil,
  User,
  Phone,
  AtSign,
  Mail,
  Globe,
  MapPin,
  Loader2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Hash,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface EditDelegateDialogProps {
  delegate: DelegateData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: DelegateData) => void;
}

export function EditDelegateDialog({
  delegate,
  open,
  onOpenChange,
  onUpdated,
}: EditDelegateDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  // Real Regions State
  const [realRegions, setRealRegions] = useState<RegionData[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

  // Profile Fields
  const [name, setName] = useState(delegate.name || '');
  const [username, setUsername] = useState(delegate.username || delegate.email.split('@')[0] || '');
  const [email, setEmail] = useState(delegate.email || '');
  const [phone, setPhone] = useState(delegate.phone || '');
  const [delegateCode, setDelegateCode] = useState(delegate.delegateCode || `DEL-2026-${String(delegate.id).padStart(6, '0')}`);
  const [region, setRegion] = useState(delegate.region || '');
  const [status, setStatus] = useState<DelegateData['status']>(delegate.status || 'online');

  // Security / Password Fields
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (open) {
      regionsService.list()
        .then((res) => {
          if (res.data) {
            setRealRegions(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingRegions(false));

      setName(delegate.name || '');
      setUsername(delegate.username || delegate.email.split('@')[0] || '');
      setEmail(delegate.email || '');
      setPhone(delegate.phone || '');
      setDelegateCode(delegate.delegateCode || `DEL-2026-${String(delegate.id).padStart(6, '0')}`);
      setRegion(delegate.region || '');
      setStatus(delegate.status || 'online');
      setChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [delegate, open]);

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

  const passwordsMatch = !newPassword || newPassword === confirmPassword;
  const isPasswordValid = !changePassword || !newPassword || (newPassword.length >= 6 && passwordsMatch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    if (changePassword && newPassword) {
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const wilayaSummary = assignedWilayasList.length > 0
        ? assignedWilayasList.join(', ')
        : region;

      const payload: UpdateDelegateParams = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        delegateCode: delegateCode.trim(),
        region,
        wilaya: wilayaSummary,
        status,
      };

      if (changePassword && newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const updated = await delegatesService.update(delegate.id, payload);

      toast.success(`Delegate profile for "${name}" updated successfully!`);
      onUpdated(updated);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update delegate profile';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[92vw] sm:max-w-[760px] md:max-w-[800px] rounded-2xl p-0 overflow-hidden bg-card text-card-foreground shadow-xl border border-border/60">
        {/* Simple & Professional Header */}
        <DialogHeader className="px-8 py-6 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2.5">
                  <span>Edit Delegate Profile</span>
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                    {delegateCode}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage contact info, commercial territory, status, and account credentials.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-8 py-7 space-y-7 max-h-[70vh] overflow-y-auto">
            {/* SECTION 1: Personal & Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Personal & Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="pl-10 h-10 text-xs bg-background rounded-xl border-border/70 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="edit-username" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      id="edit-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="pl-10 h-10 text-xs bg-background rounded-xl border-border/70 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="edit-email" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="delegate@sti.dz"
                      className="pl-10 h-10 text-xs bg-background rounded-xl border-border/70 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label htmlFor="edit-phone" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-primary" />
                    <Input
                      id="edit-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0550 11 22 33"
                      className="pl-10 h-10 text-xs bg-background rounded-xl border-border/70 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Delegate Code / Employee ID */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="edit-code" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Delegate Code (Employee ID)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-3 h-4 w-4 text-primary" />
                    <Input
                      id="edit-code"
                      value={delegateCode}
                      onChange={(e) => setDelegateCode(e.target.value)}
                      placeholder="DEL-2026-000001"
                      className="pl-10 h-10 font-mono text-xs bg-background rounded-xl border-border/70 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Territory & Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Globe className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Territory & Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Region Selection */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-500" /> Assigned Region <span className="text-destructive">*</span>
                  </label>
                  <Select value={region} onValueChange={(val) => { if (val) setRegion(val); }}>
                    <SelectTrigger className="w-full h-10 min-h-[40px] text-sm font-semibold text-foreground bg-background rounded-xl border-border/70 focus:ring-primary/20 shadow-2xs">
                      <SelectValue placeholder={loadingRegions ? 'Loading regions...' : 'Select created region'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 p-1">
                      {realRegions.length > 0 ? (
                        realRegions.map((r) => (
                          <SelectItem key={r.id} value={r.name} className="text-xs font-semibold py-2 rounded-lg cursor-pointer">
                            <span className="flex items-center gap-2">
                              <span>{r.icon || '🗺️'}</span>
                              <span>{r.name} Region</span>
                              <span className="text-[10px] text-muted-foreground font-normal">({r.wilayas?.length || 0} wilayas)</span>
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
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" /> All Wilayas Assigned to {region || 'Region'}
                  </label>
                  <Badge variant="outline" className="text-[11px] font-bold border-primary/30 text-primary bg-primary/10">
                    {assignedWilayasList.length} Wilayas Covered
                  </Badge>
                </div>

                {assignedWilayasList.length > 0 ? (
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
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
            </div>

            {/* SECTION 4: Security & Password Update */}
            <div className="space-y-4 rounded-xl border border-border/60 p-5 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="h-4 w-4 text-indigo-500" />
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Security & Password</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Edit the delegate password
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangePassword(!changePassword);
                    if (changePassword) {
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  }}
                  className="rounded-xl text-xs h-8 px-3.5 font-semibold"
                >
                  {changePassword ? 'Cancel Password Change' : 'Change Password'}
                </Button>
              </div>

              {changePassword && (
                <div className="pt-4 border-t border-border/40 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="edit-new-password" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="edit-new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="pl-10 pr-10 h-10 text-xs bg-background rounded-xl border-border/70"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="edit-confirm-password" className="text-xs font-semibold text-foreground flex items-center gap-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="edit-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className={cn(
                            'pl-10 pr-10 h-10 text-xs bg-background rounded-xl border-border/70',
                            confirmPassword && !passwordsMatch && 'border-destructive focus-visible:ring-destructive'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {confirmPassword && (
                    <div className="pt-1">
                      {passwordsMatch ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Passwords match.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Passwords do not match.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clean & Well-Spaced Footer */}
          <DialogFooter className="px-8 py-5 border-t border-border/40 bg-muted/20">
            <div className="flex items-center justify-between w-full gap-4">
              <span className="text-xs text-muted-foreground">
                All changes update the delegate account immediately.
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl h-10 px-5 text-xs font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submitting || !isPasswordValid}
                  size="sm"
                  className="gap-2 rounded-xl h-10 px-6 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                  ) : (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                  <span>Save Changes</span>
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
