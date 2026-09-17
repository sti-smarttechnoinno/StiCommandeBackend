import type { StockMovement, StockFilters, MovementType, MovementStatus } from '../types';

export function filterMovements(movements: StockMovement[], filters: StockFilters): StockMovement[] {
  return movements.filter((m) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        m.product.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.delegate.toLowerCase().includes(q) ||
        m.warehouse.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.warehouse.length > 0 && !filters.warehouse.includes(m.warehouse)) return false;
    if (filters.movementType.length > 0 && !filters.movementType.includes(m.movementType)) return false;
    if (filters.delegate.length > 0 && !filters.delegate.includes(m.delegate)) return false;
    if (filters.status.length > 0 && !filters.status.includes(m.status)) return false;
    if (filters.dateRange.start) {
      if (new Date(m.date) < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (new Date(m.date) > end) return false;
    }
    return true;
  });
}

export function sortMovements(
  movements: StockMovement[],
  field: string,
  direction: 'asc' | 'desc'
): StockMovement[] {
  return [...movements].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'reference': comparison = a.reference.localeCompare(b.reference); break;
      case 'product': comparison = a.product.localeCompare(b.product); break;
      case 'movementType': comparison = a.movementType.localeCompare(b.movementType); break;
      case 'quantity': comparison = a.quantity - b.quantity; break;
      case 'warehouse': comparison = a.warehouse.localeCompare(b.warehouse); break;
      case 'delegate': comparison = a.delegate.localeCompare(b.delegate); break;
      case 'status': comparison = a.status.localeCompare(b.status); break;
      case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      default: comparison = 0;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function getMovementTypeColor(type: MovementType): string {
  switch (type) {
    case 'incoming': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'outgoing': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    case 'transfer': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'adjustment': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
}

export function getMovementTypeLabel(type: MovementType): string {
  switch (type) {
    case 'incoming': return 'Incoming';
    case 'outgoing': return 'Outgoing';
    case 'transfer': return 'Transfer';
    case 'adjustment': return 'Adjustment';
  }
}

export function getStatusColor(status: MovementStatus): string {
  switch (status) {
    case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'in_transit': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'cancelled': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  }
}

export function getStatusLabel(status: MovementStatus): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'pending': return 'Pending';
    case 'in_transit': return 'In Transit';
    case 'cancelled': return 'Cancelled';
  }
}

export function getStatusDot(status: MovementStatus): string {
  switch (status) {
    case 'completed': return 'bg-emerald-500';
    case 'pending': return 'bg-amber-500';
    case 'in_transit': return 'bg-blue-500';
    case 'cancelled': return 'bg-rose-500';
  }
}

export function getQuantityColor(type: MovementType, quantity: number): string {
  switch (type) {
    case 'incoming': return 'text-emerald-600 dark:text-emerald-400';
    case 'outgoing': return 'text-rose-600 dark:text-rose-400';
    case 'transfer': return 'text-blue-600 dark:text-blue-400';
    case 'adjustment': return 'text-amber-600 dark:text-amber-400';
  }
}

export function getQuantityPrefix(type: MovementType): string {
  switch (type) {
    case 'incoming': return '+';
    case 'outgoing': return '-';
    case 'transfer': return '-';
    case 'adjustment': return '+';
  }
}
