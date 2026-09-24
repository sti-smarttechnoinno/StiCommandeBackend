'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  FileText,
  Loader2,
  ChevronDown,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { objectivesService, type UserTask } from '@/services/objectives';

interface UpdateTaskStatusDialogProps {
  task: UserTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  {
    value: 'pending' as const,
    label: 'En attente',
    icon: Clock,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 text-amber-600',
  },
  {
    value: 'in_progress' as const,
    label: 'En cours',
    icon: PlayCircle,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 text-blue-600',
  },
  {
    value: 'completed' as const,
    label: 'Terminée (soumise)',
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    value: 'validated' as const,
    label: 'Validée (Approuvée)',
    icon: ShieldCheck,
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 font-bold',
  },
  {
    value: 'problem' as const,
    label: 'Problème signalé (À revoir)',
    icon: AlertTriangle,
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold',
  },
  {
    value: 'cancelled' as const,
    label: 'Annulée',
    icon: XCircle,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 text-rose-600',
  },
];

export function UpdateTaskStatusDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: UpdateTaskStatusDialogProps) {
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'validated' | 'problem' | 'cancelled'>('in_progress');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setNotes(task.completion_notes || '');
    }
  }, [task]);

  if (!task) return null;

  const currentOption = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];
  const CurrentIcon = currentOption.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await objectivesService.updateTaskStatus(task.id, status, notes.trim() || undefined);
      toast.success('Statut de la mission mis à jour avec succès.');
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erreur lors de la mise à jour du statut.';
      toast.error(errorMsg || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight">Mettre à jour la mission</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">
                {task.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Compte-rendu du collaborateur si présent */}
          {task.completion_notes && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Compte-rendu soumis :
              </span>
              <p className="text-xs text-foreground/90 italic leading-relaxed">
                &quot;{task.completion_notes}&quot;
              </p>
            </div>
          )}

          {/* Quick validation shortcuts for managers */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatus('validated')}
              className={cn(
                "flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 border transition-all cursor-pointer",
                status === 'validated'
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Valider
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatus('problem')}
              className={cn(
                "flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 border transition-all cursor-pointer",
                status === 'problem'
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Signaler problème
            </Button>
          </div>

          {/* Nouveau Statut Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Nouveau Statut</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", currentOption.bgClass)}>
                {currentOption.label}
              </span>
            </label>

            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none w-full" nativeButton={false}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  className="h-10 px-3.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium flex items-center justify-between w-full transition-all text-foreground cursor-pointer focus-visible:ring-1 focus-visible:ring-primary/40"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <CurrentIcon className={cn("h-4 w-4 shrink-0", currentOption.colorClass)} />
                    <span className="truncate font-semibold">{currentOption.label}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-[220px] rounded-xl p-1.5 shadow-xl border-border/60 bg-card">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
                    Sélectionner le statut
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = status === opt.value;
                    return (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={isSelected}
                        onCheckedChange={() => setStatus(opt.value)}
                        className="rounded-lg cursor-pointer text-xs py-2 px-2.5 font-medium flex items-center justify-between hover:bg-muted/70"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("h-4 w-4 shrink-0", opt.colorClass)} />
                          <span className={cn(isSelected ? "font-bold text-foreground" : "text-foreground/80")}>
                            {opt.label}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Notes / Compte-rendu */}
          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Compte-rendu / Remarques (Optionnel)</span>
            </label>
            <Textarea
              placeholder="Ex: Visite effectuée avec succès, commande signée..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[90px] text-xs resize-none rounded-xl bg-muted/30 border-border/60 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 leading-relaxed"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2.5 -mx-6 -mb-5 rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-full h-9 px-4 text-xs font-semibold border-border/70 hover:bg-muted cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-full h-9 px-5 text-xs font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
