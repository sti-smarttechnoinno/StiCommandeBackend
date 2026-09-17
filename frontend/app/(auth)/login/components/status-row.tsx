'use client';

import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusRowProps {
  name: string;
  status: string;
  icon: LucideIcon;
  isLast?: boolean;
}

export const StatusRow = memo(function StatusRow({
  name,
  status,
  icon: Icon,
  isLast = false,
}: StatusRowProps) {
  return (
    <div
      className={cn(
        'h-[44px] flex items-center justify-between py-2',
        !isLast && 'border-b border-[#E5E7EB]'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 text-[#6B7280] flex-shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium text-[#374151] truncate">{name}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" aria-hidden="true" />
        <span className="text-xs font-bold text-[#166534]">{status}</span>
      </div>
    </div>
  );
});
