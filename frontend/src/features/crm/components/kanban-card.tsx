'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  ShoppingCart,
  User,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { CrmOpportunity } from '@/types/crm-pipeline';
import { useRouter } from 'next/navigation';

interface KanbanCardProps {
  opportunity: CrmOpportunity;
  onEdit: (opp: CrmOpportunity) => void;
  onMarkLost: (opp: CrmOpportunity) => void;
  onMarkWon: (opp: CrmOpportunity) => void;
  onDelete: (id: number) => void;
}

export function KanbanCard({
  opportunity,
  onEdit,
  onMarkLost,
  onMarkWon,
  onDelete,
}: KanbanCardProps) {
  const router = useRouter();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(opportunity.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const isOverdue =
    opportunity.expected_closing_date &&
    opportunity.stage !== 'won' &&
    opportunity.stage !== 'lost' &&
    new Date(opportunity.expected_closing_date) < new Date();

  const targetName = opportunity.client?.name || opportunity.lead?.company_name || opportunity.lead?.name || 'Inconnu';
  const targetType = opportunity.client_id ? 'Client' : 'Prospect';
  const wilaya = opportunity.client?.wilaya || opportunity.lead?.wilaya || '';

  const formatDzd = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="p-3.5 bg-card/90 hover:bg-card border-border/70 rounded-xl shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none group relative border-l-4 border-l-primary/60 hover:border-l-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-4.5 font-semibold ${
                targetType === 'Client'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-200/50 dark:border-blue-900/40'
                  : 'bg-purple-500/10 text-purple-600 border-purple-200/50 dark:border-purple-900/40'
              }`}
            >
              {targetType}
            </Badge>

            {opportunity.priority === 'high' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 font-bold bg-rose-500/10 text-rose-600 border-rose-200/50">
                Urgent 🔥
              </Badge>
            )}

            <span className="text-[10px] text-muted-foreground font-semibold">
              {opportunity.probability}%
            </span>
          </div>

          <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
            {opportunity.title}
          </h4>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-1 truncate">
            <Building2 className="h-3 w-3 text-muted-foreground/80 flex-shrink-0" />
            <span className="truncate">{targetName}</span>
            {wilaya && <span className="text-[10px] text-muted-foreground/70">({wilaya})</span>}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
            <DropdownMenuItem onClick={() => onEdit(opportunity)} className="gap-2 cursor-pointer">
              <Edit className="h-3.5 w-3.5" />
              <span>Modifier</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push(`/crm/quotes/new?opportunityId=${opportunity.id}`)}
              className="gap-2 cursor-pointer text-indigo-600 font-semibold"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Générer un devis</span>
            </DropdownMenuItem>

            {opportunity.client_id && (
              <DropdownMenuItem
                onClick={() => router.push(`/orders/new?clientId=${opportunity.client_id}`)}
                className="gap-2 cursor-pointer text-primary font-semibold"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Créer commande</span>
              </DropdownMenuItem>
            )}

            {opportunity.stage !== 'won' && (
              <DropdownMenuItem
                onClick={() => onMarkWon(opportunity)}
                className="gap-2 cursor-pointer text-emerald-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Marquer gagnée</span>
              </DropdownMenuItem>
            )}

            {opportunity.stage !== 'lost' && (
              <DropdownMenuItem
                onClick={() => onMarkLost(opportunity)}
                className="gap-2 cursor-pointer text-rose-600"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Marquer perdue</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(opportunity.id)}
              className="gap-2 cursor-pointer text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
        <div className="font-extrabold text-foreground text-xs">
          {formatDzd(opportunity.amount)}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {opportunity.expected_closing_date && (
            <div
              className={`flex items-center gap-1 text-[10px] font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : ''
              }`}
              title="Date d'échéance"
            >
              {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              <span>{opportunity.expected_closing_date}</span>
            </div>
          )}

          {opportunity.user && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title={opportunity.user.name}>
              <User className="h-3 w-3" />
              <span className="truncate max-w-[70px]">{opportunity.user.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </div>

      {opportunity.lost_reason && opportunity.stage === 'lost' && (
        <div className="mt-2 text-[10px] p-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
          <span className="font-semibold">Motif :</span> {opportunity.lost_reason}
        </div>
      )}
    </Card>
  );
}
