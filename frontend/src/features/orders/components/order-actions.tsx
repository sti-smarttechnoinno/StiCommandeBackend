'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Pencil, MoreHorizontal, Check, X, Printer, Trash2, Copy, ArrowRight } from 'lucide-react';
import type { OrderStatus } from '@/types';

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPrint: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function OrderActions({
  orderId,
  status,
  onView,
  onEdit,
  onApprove,
  onReject,
  onPrint,
  onDelete,
  onDuplicate,
}: OrderActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          onClick={() => onView(orderId)}
        >
          <Eye className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent>View order</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          type="button"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          onClick={() => onEdit(orderId)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent>Edit order</TooltipContent>
      </Tooltip>

      {(status === 'pending' || status === 'partially_validated') && (
        <>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              onClick={() => onApprove(orderId)}
            >
              <Check className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Valider la commande (ouvrir le détail)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="h-7 w-7 rounded-md inline-flex items-center justify-center text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              onClick={() => onReject(orderId)}
            >
              <X className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent>Rejeter la commande</TooltipContent>
          </Tooltip>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => onView(orderId)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Voir la commande
          </DropdownMenuItem>
          {(status === 'pending' || status === 'partially_validated') && (
            <>
              <DropdownMenuItem className="rounded-lg cursor-pointer text-xs text-emerald-600 focus:text-emerald-700" onClick={() => onApprove(orderId)}>
                <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                Valider la commande
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer text-xs text-rose-600 focus:text-rose-700" onClick={() => onReject(orderId)}>
                <X className="mr-2 h-3.5 w-3.5 text-rose-600" />
                Rejeter la commande
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
            </>
          )}
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => onEdit(orderId)}>
            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => onPrint(orderId)}>
            <Printer className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Imprimer
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => onDuplicate(orderId)}>
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Dupliquer
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs">
            <ArrowRight className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Suivi livraison
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem className="rounded-lg cursor-pointer text-xs text-destructive focus:text-destructive" onClick={() => onDelete(orderId)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
