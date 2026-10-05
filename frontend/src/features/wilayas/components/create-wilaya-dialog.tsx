'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { wilayasService } from '@/services/wilayas';
import { toast } from 'sonner';
import {
  MapPin,
  Check,
  Loader2,
  Building2,
  AlertCircle,
  Hash,
  X,
} from 'lucide-react';
import type { WilayaRow } from '../types';

interface CreateWilayaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (wilaya: WilayaRow) => void;
}

export function CreateWilayaDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWilayaDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  // Existing codes for real-time instant uniqueness validation
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [loadingCodes, setLoadingCodes] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});

  useEffect(() => {
    if (open) {
      // Reset form
      setCode('');
      setName('');
      setErrors({});

      // Fetch all existing codes to ensure uniqueness client-side instantly
      setLoadingCodes(true);
      wilayasService
        .list({ pageSize: 150 })
        .then((res) => {
          if (res?.data) {
            const codes = new Set(res.data.map((w) => String(w.code).trim().padStart(2, '0')));
            setExistingCodes(codes);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCodes(false));
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: { code?: string; name?: string } = {};

    const cleanCode = code.trim();
    if (!cleanCode) {
      newErrors.code = 'Le numéro de wilaya est obligatoire (ex: 16, 59).';
    } else if (!/^[0-9]{1,3}$/.test(cleanCode)) {
      newErrors.code = 'Le code doit contenir entre 1 et 3 chiffres numériques.';
    } else {
      const formattedCode = cleanCode.padStart(2, '0');
      if (existingCodes.has(formattedCode)) {
        newErrors.code = `Le code wilaya ${formattedCode} existe déjà. Il doit être unique.`;
      }
    }

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Le nom de la wilaya est obligatoire.';
    } else if (cleanName.length < 2) {
      newErrors.name = 'Le nom doit comporter au moins 2 caractères.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCodeChange = (val: string) => {
    // Only allow digits up to 3 chars
    const digitsOnly = val.replace(/\D/g, '').slice(0, 3);
    setCode(digitsOnly);

    if (errors.code) {
      setErrors((prev) => ({ ...prev, code: undefined }));
    }

    if (digitsOnly) {
      const formatted = digitsOnly.padStart(2, '0');
      if (existingCodes.has(formatted)) {
        setErrors((prev) => ({
          ...prev,
          code: `Le code wilaya ${formatted} existe déjà. Il doit être unique.`,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formattedCode = code.trim().padStart(2, '0');

      const createdWilaya = await wilayasService.create({
        code: formattedCode,
        name: name.trim(),
        status: 'active',
      });

      toast.success(`Wilaya "${formattedCode} - ${name.trim()}" créée avec succès !`);
      onOpenChange(false);
      if (onCreated) {
        onCreated(createdWilaya);
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.errors?.code?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la création de la wilaya.';
      if (serverMessage.toLowerCase().includes('already been taken') || serverMessage.toLowerCase().includes('unique')) {
        setErrors((prev) => ({
          ...prev,
          code: `Le code wilaya ${code.trim().padStart(2, '0')} est déjà utilisé.`,
        }));
      }
      toast.error(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-border/60 shadow-2xl bg-card">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Ajouter une nouvelle Wilaya</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Renseignez le numéro de code et le nom de la wilaya.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code Field */}
          <div className="space-y-1.5">
            <label htmlFor="wilaya-code" className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Numéro de Wilaya <span className="text-destructive">*</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {code ? `Code: ${code.padStart(2, '0')}` : 'Unique (ex: 59)'}
              </span>
            </label>
            <div className="relative">
              <Input
                id="wilaya-code"
                placeholder="Ex: 59"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={cn(
                  'h-10 text-sm font-mono pr-8 rounded-xl',
                  errors.code && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={submitting}
                autoFocus
              />
              {code && !errors.code && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              )}
            </div>
            {errors.code && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 leading-tight">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.code}
              </p>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label htmlFor="wilaya-name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Nom de la Wilaya <span className="text-destructive">*</span>
            </label>
            <Input
              id="wilaya-name"
              placeholder="Ex: El Menia"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={cn(
                'h-10 text-sm rounded-xl',
                errors.name && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={submitting}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 leading-tight">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Footer Actions Styled to match website standard */}
          <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-full h-9 px-5 text-xs font-semibold bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !!errors.code}
              className="gap-2 rounded-full h-9 px-6 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Créer la Wilaya
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
