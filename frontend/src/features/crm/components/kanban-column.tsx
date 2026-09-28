'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanCard } from './kanban-card';
import type { CrmOpportunity, OpportunityStage } from '@/types/crm-pipeline';

interface KanbanColumnProps {
  stage: OpportunityStage;
  title: string;
  color: string;
  badgeBg: string;
  opportunities: CrmOpportunity[];
  onDropCard: (cardId: number, targetStage: OpportunityStage) => void;
  onAddCard: (stage: OpportunityStage) => void;
  onEditCard: (opp: CrmOpportunity) => void;
  onMarkLost: (opp: CrmOpportunity) => void;
  onMarkWon: (opp: CrmOpportunity) => void;
  onDeleteCard: (id: number) => void;
}

export function KanbanColumn({
  stage,
  title,
  color,
  badgeBg,
  opportunities,
  onDropCard,
  onAddCard,
  onEditCard,
  onMarkLost,
  onMarkWon,
  onDeleteCard,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  const totalAmount = opportunities.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const cardIdStr = e.dataTransfer.getData('text/plain');
    if (cardIdStr) {
      const cardId = parseInt(cardIdStr, 10);
      if (!isNaN(cardId)) {
        onDropCard(cardId, stage);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[280px] max-w-[340px] bg-muted/40 rounded-2xl p-3 border transition-colors ${
        isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="text-xs font-bold text-foreground tracking-tight">{title}</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg}`}>
            {opportunities.length}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddCard(stage)}
          className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          title="Ajouter dans cette colonne"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Total amount summary for column */}
      <div className="text-[11px] font-semibold text-muted-foreground mb-3 px-1 flex items-center justify-between">
        <span>Total :</span>
        <span className="font-extrabold text-foreground">{formatDzd(totalAmount)}</span>
      </div>

      {/* Card List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[150px] pr-0.5">
        {opportunities.map((opp) => (
          <KanbanCard
            key={opp.id}
            opportunity={opp}
            onEdit={onEditCard}
            onMarkLost={onMarkLost}
            onMarkWon={onMarkWon}
            onDelete={onDeleteCard}
          />
        ))}

        {opportunities.length === 0 && (
          <div className="h-28 border border-dashed border-border/70 rounded-xl flex items-center justify-center text-[11px] text-muted-foreground/70 font-medium">
            Déposez une opportunité ici
          </div>
        )}
      </div>
    </div>
  );
}
