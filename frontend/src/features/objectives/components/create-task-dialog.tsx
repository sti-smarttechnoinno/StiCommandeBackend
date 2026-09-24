'use client';

import { useState, useRef } from 'react';
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  Tag,
  Paperclip,
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCheck,
  Loader2,
  MapPin,
  DollarSign,
  TrendingUp,
  Shield,
  ChevronDown,
  Check,
  Lock,
  Users,
  Target,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { AssignableUserPicker } from './assignable-user-picker';
import { objectivesService, type AssignableUser } from '@/services/objectives';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: AssignableUser[];
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'client_visit', label: 'Visite Client', icon: MapPin },
  { value: 'recouvrement', label: 'Recouvrement', icon: DollarSign },
  { value: 'prospection', label: 'Prospection Terrain', icon: TrendingUp },
  { value: 'product_promotion', label: 'Promotion Produit', icon: Tag },
  { value: 'reporting', label: 'Rapport d’activité', icon: FileText },
  { value: 'administrative', label: 'Administratif', icon: Shield },
  { value: 'other', label: 'Autre Mission', icon: CheckSquare },
];

const PRIORITIES = [
  { value: 'low', label: 'Basse', dotColor: 'bg-slate-400', badgeClass: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Normale', dotColor: 'bg-blue-500', badgeClass: 'bg-blue-500/10 text-blue-600' },
  { value: 'high', label: 'Haute', dotColor: 'bg-amber-500', badgeClass: 'bg-amber-500/10 text-amber-600 font-semibold' },
  { value: 'urgent', label: 'Urgente', dotColor: 'bg-rose-500', badgeClass: 'bg-rose-500/10 text-rose-600 font-bold' },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  assignableUsers,
  onSuccess,
}: CreateTaskDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('client_visit');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);

  // Attribution avec fichier toggle & state
  const [hasFileAttribution, setHasFileAttribution] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 20 Mo.');
        return;
      }
      setAttachedFile(file);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="h-5 w-5 text-red-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage className="h-5 w-5 text-blue-500" />;
    return <FileCheck className="h-5 w-5 text-muted-foreground" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Veuillez indiquer l’intitulé de la mission / tâche.');
      return;
    }

    if (!isPrivate && selectedUserIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un collaborateur concerné.');
      return;
    }

    if (hasFileAttribution && !attachedFile) {
      toast.error('Vous avez activé l’attribution avec fichier. Veuillez joindre un document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('category', category);
      formData.append('priority', priority);
      if (dueDate) {
        formData.append('due_date', dueDate);
      }
      formData.append('is_private', isPrivate ? '1' : '0');
      formData.append('has_file_attribution', hasFileAttribution ? '1' : '0');

      if (!isPrivate) {
        selectedUserIds.forEach((id) => {
          formData.append('assigned_to[]', id.toString());
        });
      }

      if (hasFileAttribution && attachedFile) {
        formData.append('file', attachedFile);
      }

      const res = await objectivesService.createTask(formData);
      if (isPrivate) {
        toast.success('Objectif personnel & privé créé avec succès.');
      } else {
        toast.success(`Mission assignée avec succès à ${res.count} collaborateur(s).`);
      }

      onSuccess();
      onOpenChange(false);

      // Reset
      setTitle('');
      setDescription('');
      setCategory('client_visit');
      setPriority('medium');
      setDueDate('');
      setSelectedUserIds([]);
      setIsPrivate(false);
      setHasFileAttribution(false);
      setAttachedFile(null);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Erreur lors de la création de la tâche.';
      toast.error(errorMsg || 'Erreur lors de la création de la tâche.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shrink-0 transition-colors",
              isPrivate ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-primary/10 text-primary"
            )}>
              {isPrivate ? <Lock className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {isPrivate ? 'Créer un Objectif Personnel & Privé' : 'Créer & Assigner une Mission / Tâche'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isPrivate
                  ? 'Définissez un objectif confidentiel pour vous-même seul. Aucun autre utilisateur n’y aura accès.'
                  : 'Définissez les tâches opérationnelles, les priorités et joignez des documents d’attribution.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 space-y-5">
          {/* Mode Selector: Mission d'Équipe vs Objectif Privé */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Type d&apos;Objectif</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/50 border border-border/50">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  !isPrivate
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Mission d&apos;Équipe (Assigner)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPrivate(true);
                  setSelectedUserIds([]);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  isPrivate
                    ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-500/30 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Lock className="h-3.5 w-3.5 text-indigo-500" />
                <span>Objectif Privé (Pour moi-même seul)</span>
              </button>
            </div>
          </div>

          {/* User Multi-picker OR Private Info Banner */}
          {!isPrivate ? (
            <AssignableUserPicker
              users={assignableUsers}
              selectedIds={selectedUserIds}
              onChange={setSelectedUserIds}
              disabled={isSubmitting}
            />
          ) : (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                <Lock className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Objectif strictement privé & confidentiel</span>
                  <span className="px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    Visible par vous seul
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cet objectif restera strictement personnel. Ni les collaborateurs, ni les managers, ni les administrateurs ne pourront voir son contenu ni son statut dans leur tableau de bord.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>{isPrivate ? 'Intitulé de mon Objectif' : 'Intitulé de la Mission'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder={isPrivate ? "Ex: Terminer la formation produit et réviser mon portefeuille clients" : "Ex: Visiter les pharmacies du secteur Ouest pour présentation nouvelle gamme"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category, Priority, Due Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Catégorie</span>
              </label>
              {(() => {
                const currentCategory = CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];
                const CurrentCategoryIcon = currentCategory.icon;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none w-full" nativeButton={false}>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSubmitting}
                        className="h-10 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium flex items-center justify-between w-full transition-all text-foreground cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CurrentCategoryIcon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{currentCategory.label}</span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl border-border/60 shadow-xl p-1.5">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Catégorie de la mission</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <DropdownMenuCheckboxItem
                              key={cat.value}
                              checked={category === cat.value}
                              onCheckedChange={() => setCategory(cat.value)}
                              className="rounded-lg cursor-pointer text-xs py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{cat.label}</span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          );
                        })}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </div>

            {/* Priority Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Priorité</span>
              </label>
              {(() => {
                const currentPriority = PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none w-full" nativeButton={false}>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSubmitting}
                        className="h-10 px-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-xs font-medium flex items-center justify-between w-full transition-all text-foreground cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', currentPriority.dotColor)} />
                          <span className={cn('truncate font-semibold', currentPriority.badgeClass.includes('text-') ? currentPriority.badgeClass.split(' ').find(c => c.startsWith('text-')) : '')}>
                            {currentPriority.label}
                          </span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0 ml-1.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 rounded-xl border-border/60 shadow-xl p-1.5">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Niveau de priorité</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {PRIORITIES.map((p) => (
                          <DropdownMenuCheckboxItem
                            key={p.value}
                            checked={priority === p.value}
                            onCheckedChange={() => setPriority(p.value as any)}
                            className="rounded-lg cursor-pointer text-xs py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn('w-2 h-2 rounded-full shrink-0', p.dotColor)} />
                              <span className={cn('font-semibold', p.badgeClass.includes('text-') ? p.badgeClass.split(' ').find(c => c.startsWith('text-')) : '')}>
                                {p.label}
                              </span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>Échéance</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 pl-10 pr-8 rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 font-medium"
                  disabled={isSubmitting}
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Description & Objectif de la mission</span>
            </label>
            <Textarea
              placeholder="Précisez les consignes opérationnelles, les clients cibles, les montants à recouvrer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[85px] rounded-xl border-border/60 text-xs bg-muted/30 focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary/40 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* ATTRIBUTION AVEC FICHIER TOGGLE & DROPZONE */}
          <div className="space-y-3.5 rounded-2xl border border-border/60 p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    Attribution avec document joint
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Joindre un bon de mission, feuille de route, listing clients ou contrat d’objectifs
                  </div>
                </div>
              </div>
              <Switch
                checked={hasFileAttribution}
                onCheckedChange={(checked) => {
                  setHasFileAttribution(checked);
                  if (!checked) removeFile();
                }}
                disabled={isSubmitting}
              />
            </div>

            {hasFileAttribution && (
              <div className="pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                  className="hidden"
                  disabled={isSubmitting}
                />

                {!attachedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-background/50 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <div className="p-2.5 rounded-full bg-muted/60 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Cliquez pour sélectionner un document
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Formats acceptés: PDF, Word, Excel, Images (Max: 20 Mo)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border/40">
                        {getFileIcon(attachedFile.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          {attachedFile.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(attachedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={removeFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
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
                  {isPrivate ? 'Enregistrement...' : 'Création en cours...'}
                </>
              ) : isPrivate ? (
                'Enregistrer mon Objectif Privé'
              ) : selectedUserIds.length > 0 ? (
                `Assigner aux ${selectedUserIds.length} sélectionné(s)`
              ) : (
                'Assigner la mission'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
