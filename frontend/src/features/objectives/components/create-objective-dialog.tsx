'use client';

import { useState } from 'react';
import { Target, Calendar, DollarSign, ShoppingCart, FileText, Loader2, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { AssignableUserPicker } from './assignable-user-picker';
import { objectivesService, type AssignableUser } from '@/services/objectives';

interface CreateObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: AssignableUser[];
  onSuccess: () => void;
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export function CreateObjectiveDialog({
  open,
  onOpenChange,
  assignableUsers,
  onSuccess,
}: CreateObjectiveDialogProps) {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [targetRevenue, setTargetRevenue] = useState<string>('');
  const [targetOrders, setTargetOrders] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une personne concernée.');
      return;
    }

    const revenueNum = parseFloat(targetRevenue.replace(/\s/g, ''));
    if (isNaN(revenueNum) || revenueNum < 0) {
      toast.error('Veuillez saisir un objectif de chiffre d’affaires valide.');
      return;
    }

    const ordersNum = parseInt(targetOrders, 10);
    if (isNaN(ordersNum) || ordersNum < 0) {
      toast.error('Veuillez saisir un nombre valide de commandes cibles.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await objectivesService.batchAssignObjectives({
        user_ids: selectedUserIds,
        year,
        month,
        target_revenue: revenueNum,
        target_orders: ordersNum,
        notes: notes.trim() || undefined,
      });

      toast.success(
        `Objectifs mensuels assignés avec succès à ${res.count} collaborateur(s).`
      );
      onSuccess();
      onOpenChange(false);
      // Reset form
      setTargetRevenue('');
      setTargetOrders('0');
      setNotes('');
      setSelectedUserIds([]);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erreur lors de l’attribution des objectifs.';
      toast.error(errorMsg || 'Erreur lors de l’attribution des objectifs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">Définir les Objectifs Mensuels</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Attribuez les objectifs de chiffre d’affaires et de commandes aux collaborateurs concernés.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 space-y-5">
          {/* Multi-user picker */}
          <AssignableUserPicker
            users={assignableUsers}
            selectedIds={selectedUserIds}
            onChange={setSelectedUserIds}
            disabled={isSubmitting}
          />

          {/* Period Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Mois de l&apos;objectif</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none w-full" nativeButton={false}>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium flex items-center justify-between w-full transition-all text-foreground cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{MONTHS.find((m) => m.value === month)?.label || 'Mois'}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl border-border/60 shadow-xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Mois de l&apos;objectif</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {MONTHS.map((m) => (
                      <DropdownMenuCheckboxItem
                        key={m.value}
                        checked={month === m.value}
                        onCheckedChange={() => setMonth(m.value)}
                        className="rounded-lg cursor-pointer text-xs py-2"
                      >
                        {m.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>Année</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none w-full" nativeButton={false}>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSubmitting}
                    className="h-10 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium flex items-center justify-between w-full transition-all text-foreground cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate font-semibold">{year}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 rounded-xl border-border/60 shadow-xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Année</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {years.map((y) => (
                      <DropdownMenuCheckboxItem
                        key={y}
                        checked={year === y}
                        onCheckedChange={() => setYear(y)}
                        className="rounded-lg cursor-pointer text-xs py-2"
                      >
                        {y}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span>Objectif Chiffre d’Affaires (DA)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 5000000"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  className="h-10 rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 pr-12 font-mono font-medium"
                  required
                  disabled={isSubmitting}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md pointer-events-none">
                  DA
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <ShoppingCart className="h-3.5 w-3.5 text-purple-500" />
                <span>Nombre de Commandes Cible</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Ex: 50"
                value={targetOrders}
                onChange={(e) => setTargetOrders(e.target.value)}
                className="h-10 rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 font-mono font-medium"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Directives & Remarques (Optionnel)</span>
            </label>
            <Textarea
              placeholder="Instructions particulières, focus gammes de produits, conditions de validation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[85px] rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="px-6 sm:px-8 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2.5 sticky bottom-0 z-10 -mx-6 sm:-mx-8 -mb-5 rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-full h-9 px-4 text-xs font-semibold border-border/70 hover:bg-muted"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-full h-9 px-5 text-xs font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Attribution en cours...
                </>
              ) : (
                `Assigner aux ${selectedUserIds.length} sélectionné(s)`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
