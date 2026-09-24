'use client';

import { useState } from 'react';
import {
  History,
  FileText,
  Download,
  Clock,
  ArrowRight,
  Search,
  RefreshCw,
  CheckCircle2,
  PlayCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  Loader2,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TaskHistoryItem } from '@/services/objectives';

interface TaskHistoryTabProps {
  history: TaskHistoryItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function TaskHistoryTab({ history, loading, onRefresh }: TaskHistoryTabProps) {
  const [search, setSearch] = useState('');

  const safeHistory = Array.isArray(history) ? history : [];

  const filteredHistory = safeHistory.filter((item) => {
    const q = search.toLowerCase();
    const taskTitle = item.task?.title?.toLowerCase() || item.task_title?.toLowerCase() || '';
    const actor = item.performed_by_name?.toLowerCase() || item.user_name?.toLowerCase() || '';
    const notes = item.notes?.toLowerCase() || item.comment?.toLowerCase() || '';
    const fileName = item.file_name?.toLowerCase() || item.attachment_name?.toLowerCase() || '';
    return taskTitle.includes(q) || actor.includes(q) || notes.includes(q) || fileName.includes(q);
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full gap-1 text-[11px] font-semibold px-2.5 py-0.5">
            <Clock className="h-3 w-3" /> Attribution Créée
          </Badge>
        );
      case 'status_changed':
      case 'status_updated':
        return (
          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full gap-1 text-[11px] font-semibold px-2.5 py-0.5">
            <RefreshCw className="h-3 w-3" /> Évolution Statut
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full gap-1 text-[11px] font-semibold px-2.5 py-0.5">
            <CheckCircle2 className="h-3 w-3" /> Mission Validée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full gap-1 text-[11px] font-semibold px-2.5 py-0.5">
            <XCircle className="h-3 w-3" /> Annulée
          </Badge>
        );
      case 'file_uploaded':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full gap-1 text-[11px] font-semibold px-2.5 py-0.5">
            <Paperclip className="h-3 w-3" /> Document Joint
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="rounded-full text-[11px]">{action}</Badge>;
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    if (!status) return '—';
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  return (
    <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card flex flex-col w-full py-0 gap-0">
      {/* Integrated Header & Search matching Orders and Delivery Notes */}
      <CardHeader className="pt-5 sm:pt-6 px-5 sm:px-6 pb-4 border-b border-border/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <History className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold tracking-tight">Journal d&apos;Audit & Traçabilité</CardTitle>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                  {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                  <span>{filteredHistory.length} Événements</span>
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Historique chronologique des affectations, documents joints et changements de statuts
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Rechercher dans l'historique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-full cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Effacer</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full h-8 px-3.5 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs transition-all duration-200"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3 text-amber-500 transition-transform duration-700", loading && "animate-spin")} />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* History Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border/60">
            <TableRow className="hover:bg-transparent border-b border-border/60">
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap w-[150px]">Date & Heure</TableHead>
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap w-[160px]">Action</TableHead>
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap w-[160px]">Intervenant</TableHead>
              <TableHead className="py-4 px-6 text-xs font-bold text-foreground min-w-[200px]">Mission Concernée</TableHead>
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap w-[180px]">Transition Statut</TableHead>
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground whitespace-nowrap w-[160px]">Fichier Joint</TableHead>
              <TableHead className="py-4 px-5 text-xs font-bold text-foreground">Remarques / Compte-rendu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="font-semibold">Chargement du journal d&apos;audit...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-foreground text-sm">Aucun événement dans l&apos;historique</p>
                    <p className="text-xs text-muted-foreground">
                      Les créations, affectations de documents et transitions de statut apparaîtront ici.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40 transition-colors border-b border-border/40 group text-xs">
                  <TableCell className="py-3.5 px-5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {item.created_at
                      ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : '—'}
                  </TableCell>
                  <TableCell className="py-3.5 px-5">{getActionBadge(item.action)}</TableCell>
                  <TableCell className="py-3.5 px-5 font-semibold text-foreground">
                    {item.performed_by_name || 'Système'}
                  </TableCell>
                  <TableCell className="py-3.5 px-6">
                    <div className="font-semibold text-xs text-foreground line-clamp-1">
                      {item.task?.title || `Tâche #${item.task_id}`}
                    </div>
                    {item.task?.assigned_to_name && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Assigné à : <span className="font-medium text-foreground">{item.task.assigned_to_name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-5">
                    {item.to_status ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-muted-foreground font-medium">
                          {getStatusLabel(item.from_status)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-bold text-foreground">
                          {getStatusLabel(item.to_status)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-5">
                    {item.has_file && item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all shadow-2xs"
                      >
                        <Download className="h-3 w-3" />
                        <span className="truncate max-w-[110px]">
                          {item.file_name || 'Document'}
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-5 max-w-[240px]">
                    {item.notes ? (
                      <p className="line-clamp-2 text-[11px] text-muted-foreground italic bg-muted/40 px-2 py-1 rounded-md border border-border/30">
                        &quot;{item.notes}&quot;
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
