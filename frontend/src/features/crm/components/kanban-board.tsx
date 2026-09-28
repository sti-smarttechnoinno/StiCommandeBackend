'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanColumn } from './kanban-column';
import { OpportunityDialog } from './opportunity-dialog';
import { LostReasonDialog } from './lost-reason-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, RefreshCw, Loader2, Target, Layers } from 'lucide-react';
import { crmOpportunitiesService } from '@/services/crm-pipeline';
import type {
  CrmOpportunity,
  OpportunityStage,
  OpportunityPriority,
  PipelineColumns,
} from '@/types/crm-pipeline';
import { toast } from 'sonner';

interface KanbanBoardProps {
  region?: string;
  userId?: number;
}

const DEFAULT_COLUMNS: PipelineColumns = {
  qualification: [],
  proposal: [],
  negotiation: [],
  won: [],
  lost: [],
};

export function KanbanBoard({ region, userId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<PipelineColumns>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Dialogs
  const [oppDialogOpen, setOppDialogOpen] = useState(false);
  const [oppToEdit, setOppToEdit] = useState<CrmOpportunity | null>(null);
  const [targetAddStage, setTargetAddStage] = useState<OpportunityStage>('qualification');

  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [oppToLose, setOppToLose] = useState<CrmOpportunity | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    crmOpportunitiesService
      .listKanban({
        region: region && region !== 'all' ? region : undefined,
        user_id: userId,
        search: search.trim() || undefined,
        priority: priorityFilter !== 'all' ? (priorityFilter as OpportunityPriority) : undefined,
      })
      .then((res) => {
        setColumns(res.columns || DEFAULT_COLUMNS);
      })
      .catch(() => {
        toast.error('Erreur lors du chargement du pipeline.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [region, userId, search, priorityFilter]);

  useEffect(() => {
    loadData();
    window.addEventListener('sti-crm-opp-updated', loadData);
    return () => {
      window.removeEventListener('sti-crm-opp-updated', loadData);
    };
  }, [loadData]);

  // Handle Drag & Drop
  const handleDropCard = async (cardId: number, targetStage: OpportunityStage) => {
    // Find current card in columns
    let foundCard: CrmOpportunity | null = null;
    let sourceStage: OpportunityStage | null = null;

    for (const [st, list] of Object.entries(columns) as [OpportunityStage, CrmOpportunity[]][]) {
      const match = list.find((c) => c.id === cardId);
      if (match) {
        foundCard = match;
        sourceStage = st;
        break;
      }
    }

    if (!foundCard || sourceStage === targetStage) return;

    // If moving to lost, open LostReasonDialog
    if (targetStage === 'lost') {
      setOppToLose(foundCard);
      setLostDialogOpen(true);
      return;
    }

    // Optimistic UI update
    setColumns((prev) => {
      const newCols = { ...prev };
      newCols[sourceStage!] = newCols[sourceStage!].filter((c) => c.id !== cardId);
      newCols[targetStage] = [{ ...foundCard!, stage: targetStage }, ...newCols[targetStage]];
      return newCols;
    });

    try {
      await crmOpportunitiesService.updateStage(cardId, { stage: targetStage });
      toast.success(`Étape mise à jour : ${foundCard.title}`);
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
    } catch {
      toast.error('Échec de la mise à jour de l’étape.');
      loadData(); // Revert
    }
  };

  const handleOpenAdd = (st: OpportunityStage) => {
    setOppToEdit(null);
    setTargetAddStage(st);
    setOppDialogOpen(true);
  };

  const handleOpenEdit = (opp: CrmOpportunity) => {
    setOppToEdit(opp);
    setOppDialogOpen(true);
  };

  const handleMarkWon = async (opp: CrmOpportunity) => {
    try {
      await crmOpportunitiesService.updateStage(opp.id, { stage: 'won' });
      toast.success(`Opportunité gagnée : ${opp.title} ! 🎉`);
      loadData();
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
    } catch {
      toast.error('Erreur lors de la validation.');
    }
  };

  const handleMarkLost = (opp: CrmOpportunity) => {
    setOppToLose(opp);
    setLostDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement cette opportunité ?')) return;
    try {
      await crmOpportunitiesService.delete(id);
      toast.success('Opportunité supprimée.');
      loadData();
      window.dispatchEvent(new CustomEvent('sti-crm-opp-updated'));
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const totalOpps = Object.values(columns).reduce((acc, list) => acc + (list?.length || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden w-full bg-card">
        {/* Integrated Combined Header & Filters */}
        <CardHeader className="pb-3 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Tableau Kanban des Opportunités</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5 py-0.5 gap-1.5 flex items-center">
                    {loading && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                    <span>{totalOpps} Opportunités</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Glissez-déposez les cartes pour faire progresser les affaires dans les étapes de conversion
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handleOpenAdd('qualification')}
              className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-primary-foreground" />
              <span>Nouvelle opportunité</span>
            </Button>
          </div>

          {/* Integrated Filter Row */}
          <div className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher opportunité, client, prospect..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs rounded-xl bg-background border-border/70"
                />
              </div>

              {/* Priority filter */}
              <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || 'all')}>
                <SelectTrigger className="h-8 text-xs rounded-xl w-[140px] bg-background border-border/70">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">Toutes priorités</SelectItem>
                  <SelectItem value="high" className="text-xs font-semibold text-rose-600">Haute 🔥</SelectItem>
                  <SelectItem value="medium" className="text-xs">Moyenne</SelectItem>
                  <SelectItem value="low" className="text-xs">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Board Columns container */}
        <div className="p-4 overflow-x-auto bg-muted/10">
          <div className="flex gap-3.5 min-w-[1450px]">
          <KanbanColumn
            stage="qualification"
            title="1. Qualification"
            color="bg-sky-500"
            badgeBg="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
            opportunities={columns.qualification}
            onDropCard={handleDropCard}
            onAddCard={handleOpenAdd}
            onEditCard={handleOpenEdit}
            onMarkLost={handleMarkLost}
            onMarkWon={handleMarkWon}
            onDeleteCard={handleDelete}
          />

          <KanbanColumn
            stage="proposal"
            title="2. Devis / Proposition"
            color="bg-indigo-500"
            badgeBg="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            opportunities={columns.proposal}
            onDropCard={handleDropCard}
            onAddCard={handleOpenAdd}
            onEditCard={handleOpenEdit}
            onMarkLost={handleMarkLost}
            onMarkWon={handleMarkWon}
            onDeleteCard={handleDelete}
          />

          <KanbanColumn
            stage="negotiation"
            title="3. Négociation"
            color="bg-amber-500"
            badgeBg="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            opportunities={columns.negotiation}
            onDropCard={handleDropCard}
            onAddCard={handleOpenAdd}
            onEditCard={handleOpenEdit}
            onMarkLost={handleMarkLost}
            onMarkWon={handleMarkWon}
            onDeleteCard={handleDelete}
          />

          <KanbanColumn
            stage="won"
            title="4. Gagnée 🎉"
            color="bg-emerald-500"
            badgeBg="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            opportunities={columns.won}
            onDropCard={handleDropCard}
            onAddCard={handleOpenAdd}
            onEditCard={handleOpenEdit}
            onMarkLost={handleMarkLost}
            onMarkWon={handleMarkWon}
            onDeleteCard={handleDelete}
          />

          <KanbanColumn
            stage="lost"
            title="5. Perdue"
            color="bg-rose-500"
            badgeBg="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            opportunities={columns.lost}
            onDropCard={handleDropCard}
            onAddCard={handleOpenAdd}
            onEditCard={handleOpenEdit}
            onMarkLost={handleMarkLost}
            onMarkWon={handleMarkWon}
            onDeleteCard={handleDelete}
          />
        </div>
      </div>
      </Card>

      {/* Opportunity Dialog */}
      <OpportunityDialog
        open={oppDialogOpen}
        onOpenChange={setOppDialogOpen}
        opportunityToEdit={oppToEdit}
        defaultStage={targetAddStage}
        onSuccess={loadData}
      />

      {/* Lost Reason Dialog */}
      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        opportunity={oppToLose}
        onSuccess={loadData}
      />
    </div>
  );
}
