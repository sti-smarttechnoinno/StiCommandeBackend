'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useUsersStore } from '../store';
import { usersService } from '@/services/users';
import { rolesService, type RoleData } from '@/services/roles';
import { regionsService } from '@/services/regions';
import type { RegionData } from '@/features/regions/types';
import { toast } from 'sonner';
import { UserPlus, X, Loader2, MapPin, Shield, ShieldCheck, UserCheck } from 'lucide-react';

export function NewUserDialog() {
  const { isNewUserDialogOpen, setNewUserDialogOpen } = useUsersStore();
  const [submitting, setSubmitting] = useState(false);

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [region, setRegion] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [role, setRole] = useState('commercial');
  const [status, setStatus] = useState<'authorized' | 'blocked'>('authorized');
  const [department, setDepartment] = useState('Commercial Operations');
  const [password, setPassword] = useState('Sti2026!');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  useEffect(() => {
    if (!isNewUserDialogOpen) return;

    let active = true;
    Promise.all([
      rolesService.list().catch(() => []),
      regionsService.list().catch(() => ({ data: [] })),
    ]).then(([rolesData, regionsResp]) => {
      if (!active) return;
      setRoles(rolesData || []);
      const regionList = (regionsResp && 'data' in regionsResp ? regionsResp.data : []) as RegionData[];
      setRegions(regionList);
      if (rolesData?.length && !role) {
        setRole(rolesData[0].slug);
      }
      if (regionList?.length && !region) {
        setRegion(regionList[0].name);
      }
    });

    return () => {
      active = false;
    };
  }, [isNewUserDialogOpen]);

  const selectedRoleObj = roles.find((r) => r.slug === role);
  const requiresRegion = selectedRoleObj?.has_region_restriction || role === 'commercial' || role === 'delegate';

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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Le nom complet est obligatoire');
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
        status: status,
      });

      toast.success('Utilisateur créé avec succès', {
        description: `${fullName} (${username}) a été enregistré avec le rôle ${selectedRoleObj?.name || role}.`,
      });
      setNewUserDialogOpen(false);
      setFullName('');
      setUsername('');
      setUsernameEdited(false);
      setEmail('');
      setPhone('');
      setEmployeeId('');
      setStatus('authorized');
      setDepartment('Commercial Operations');
      setPassword('Sti2026!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Échec de la création de l\'utilisateur';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isNewUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/60 bg-card text-card-foreground">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <span>Créer un Nouvel Utilisateur</span>
            </DialogTitle>
            <button
              onClick={() => setNewUserDialogOpen(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
          {/* Informations Générales */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Informations Générales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Nom et Prénom <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="ex: Mohamed Benali"
                  value={fullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  className="h-11 rounded-xl border-border/60 text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Identifiant (Username) <span className="text-rose-500">*</span></span>
                </label>
                <Input
                  placeholder="ex: mohamed.benali"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameEdited(true);
                  }}
                  className="h-11 rounded-xl border-border/60 text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Courriel (Optionnel)</label>
                <Input
                  type="email"
                  placeholder="ex: user@sti.dz (facultatif)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-border/60 text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Numéro de Téléphone</label>
                <Input
                  placeholder="0550 12 34 56"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl border-border/60 text-xs"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-semibold text-foreground">Matricule Employé (Optionnel)</label>
                <Input
                  placeholder="Auto-généré si vide (ex: EMP-2026-00001)"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="h-11 rounded-xl border-border/60 text-xs font-mono max-w-md"
                />
              </div>
            </div>
          </div>

          {/* Rôle & Contrôle d'Accès */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Rôle & Contrôle d'Accès
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Rôle Système <span className="text-rose-500">*</span></span>
                  </label>
                  <Select value={role} onValueChange={(v) => setRole(v ?? 'commercial')}>
                    <SelectTrigger className="h-11 rounded-xl border-border/60 text-xs">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60">
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <SelectItem key={r.id} value={r.slug} className="text-xs">
                            <span className="font-semibold">{r.name}</span>{' '}
                            <span className="text-muted-foreground text-[11px]">({r.slug})</span>
                            {r.has_region_restriction && ' • 📍 Région'}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="admin" className="text-xs">Administrateur</SelectItem>
                          <SelectItem value="charge_compte" className="text-xs">Chargé de Compte</SelectItem>
                          <SelectItem value="commercial" className="text-xs">Commercial (Restreint Région)</SelectItem>
                          <SelectItem value="warehouse" className="text-xs">Magasinier</SelectItem>
                          <SelectItem value="viewer" className="text-xs">Lecteur</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Statut du Compte <span className="text-rose-500">*</span></span>
                  </label>
                  <Select value={status} onValueChange={(v) => setStatus((v as any) || 'authorized')}>
                    <SelectTrigger className="h-11 rounded-xl border-border/60 text-xs">
                      <SelectValue placeholder="Choisir le statut" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60">
                      <SelectItem value="authorized" className="text-xs font-medium cursor-pointer text-emerald-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>Autorisé (Peut se connecter)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="blocked" className="text-xs font-medium cursor-pointer text-rose-600">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          <span>Bloqué (Connexion refusée)</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informative alert if role is regionally scoped */}
              {requiresRegion && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Périmètre Régional :</strong> Ce collaborateur aura accès exclusivement aux commandes et clients de sa région assignée.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Territoire & Affectation (Only for Commercial role) */}
          {role === 'commercial' && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Territoire & Affectation
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Région d&apos;Intervention</span>
                  <span className="text-rose-500">*</span>
                </label>
                {regions.length > 0 ? (
                  <Select value={region} onValueChange={(v) => setRegion(v || '')}>
                    <SelectTrigger className="h-11 rounded-xl border-border/60 text-xs">
                      <SelectValue placeholder="Choisir une région" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60">
                      {regions.map((reg) => (
                        <SelectItem key={reg.id} value={reg.name} className="text-xs">
                          {reg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="ex: Centre, Ouest, Est"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="h-11 rounded-xl border-border/60 text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* Sécurité & Mot de Passe */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Sécurité & Authentification
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Mot de Passe Initial</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border/60 text-xs font-mono"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Checkbox
                  checked={forcePasswordChange}
                  onCheckedChange={(v) => setForcePasswordChange(v === true)}
                />
                <span className="text-xs font-medium text-foreground">
                  Exiger la modification du mot de passe à la première connexion
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 pt-0 sticky bottom-0 bg-card border-t border-border/30 pt-4">
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl text-xs font-semibold border-border/60"
              onClick={() => setNewUserDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={submitting || !fullName.trim() || !username.trim() || (role === 'commercial' && !region.trim())}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : 'Créer l\'Utilisateur'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
