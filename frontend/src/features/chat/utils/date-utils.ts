/**
 * Utility functions for date and time formatting in Chat
 */

export function formatMessageTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return '';
  }
}

export function formatDayDivider(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) {
      return "Aujourd'hui";
    }

    if (isSameDay(date, yesterday)) {
      return 'Hier';
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch (_) {
    return dateString;
  }
}

export function formatLastSeen(isOnline: boolean, lastSeenAt: string | null): string {
  if (isOnline) {
    return 'En ligne';
  }

  if (!lastSeenAt) {
    return 'Hors ligne';
  }

  try {
    const date = new Date(lastSeenAt);
    if (isNaN(date.getTime())) return 'Hors ligne';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) {
      return 'En ligne';
    }

    if (diffMin < 60) {
      return `Vu il y a ${diffMin} min`;
    }

    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Vu aujourd'hui à ${timeStr}`;
    }

    return `Vu le ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${timeStr}`;
  } catch (_) {
    return 'Hors ligne';
  }
}

export function groupMessagesByDay<T extends { created_at: string }>(
  messages: T[]
): Array<{ dateLabel: string; messages: T[] }> {
  const groups: Array<{ dateLabel: string; messages: T[] }> = [];
  let currentLabel = '';
  let currentGroup: T[] = [];

  messages.forEach((msg) => {
    const label = formatDayDivider(msg.created_at);
    if (label !== currentLabel) {
      if (currentGroup.length > 0) {
        groups.push({ dateLabel: currentLabel, messages: currentGroup });
      }
      currentLabel = label;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groups.push({ dateLabel: currentLabel, messages: currentGroup });
  }

  return groups;
}
