import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DelegateStatus } from '../types';

export function DelegateStatusBadge({
  status,
  lastActivity,
}: {
  status: DelegateStatus;
  lastActivity?: string | null;
}) {
  if (status === 'online') {
    return (
      <Badge
        variant="outline"
        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit shadow-2xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500 animate-pulse" />
        <span>En ligne</span>
      </Badge>
    );
  }

  if (status === 'busy') {
    return (
      <Badge
        variant="outline"
        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit shadow-2xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
        <span>Occupé</span>
      </Badge>
    );
  }

  if (status === 'suspended') {
    return (
      <Badge
        variant="outline"
        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 w-fit shadow-2xs bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-rose-500" />
        <span>Suspendu</span>
      </Badge>
    );
  }

  // When created first time (never connected)
  if (status === 'never_connected' || !lastActivity) {
    return (
      <Badge
        variant="outline"
        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 w-fit shadow-2xs bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400" />
        <span>Pas encore connecté</span>
      </Badge>
    );
  }

  // Offline with last seen activity: "Offline il y a ..."
  let relativeTime = '';
  try {
    const distance = formatDistanceToNow(new Date(lastActivity), {
      addSuffix: false,
      locale: fr,
    });
    const clean = distance
      .replace('environ ', '')
      .replace("moins d'une minute", 'quelques secondes');
    relativeTime = `il y a ${clean}`;
  } catch (_) {
    relativeTime = 'récemment';
  }

  return (
    <Badge
      variant="outline"
      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 w-fit shadow-2xs bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-400/30"
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-400" />
      <span>Offline {relativeTime}</span>
    </Badge>
  );
}
