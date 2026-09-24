'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { chatService } from '@/services/chat';
import type { UserStatusChangedEvent } from '@/types/chat';

export interface PresenceState {
  isOnline: boolean;
  lastSeenAt: string | null;
}

export function useChatPresence() {
  const [presenceMap, setPresenceMap] = useState<Record<number, PresenceState>>({});
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ping presence periodically (every 45s)
  const sendPing = useCallback(async () => {
    try {
      await chatService.pingPresence();
    } catch (_) {
      // Ignored
    }
  }, []);

  useEffect(() => {
    sendPing();
    pingIntervalRef.current = setInterval(sendPing, 45000);

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [sendPing]);

  // Listen to presence events from WebSocket
  useEffect(() => {
    const handleWsEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!data) return;

      if (data.type === 'USER_STATUS_CHANGED' && data.user) {
        const userId = Number(data.user.id);
        if (!isNaN(userId)) {
          setPresenceMap((prev) => ({
            ...prev,
            [userId]: {
              isOnline: Boolean(data.user.isOnline ?? (data.user.status === 'online')),
              lastSeenAt: data.user.last_seen_at || new Date().toISOString(),
            },
          }));
        }
      }

      if (data.type === 'DELEGATE_STATUS_CHANGED' && data.delegate) {
        const delegateId = Number(data.delegate.id);
        if (!isNaN(delegateId)) {
          setPresenceMap((prev) => ({
            ...prev,
            [delegateId]: {
              isOnline: Boolean(data.delegate.isOnline ?? (data.delegate.status === 'online')),
              lastSeenAt: data.delegate.lastActivity || new Date().toISOString(),
            },
          }));
        }
      }
    };

    window.addEventListener('sti-websocket-event', handleWsEvent);
    return () => {
      window.removeEventListener('sti-websocket-event', handleWsEvent);
    };
  }, []);

  const updateContactPresence = useCallback((userId: number, isOnline: boolean, lastSeenAt: string | null) => {
    setPresenceMap((prev) => ({
      ...prev,
      [userId]: { isOnline, lastSeenAt },
    }));
  }, []);

  const getUserPresence = useCallback(
    (userId: number, defaultOnline = false, defaultLastSeen: string | null = null): PresenceState => {
      if (presenceMap[userId]) {
        return presenceMap[userId];
      }
      return {
        isOnline: defaultOnline,
        lastSeenAt: defaultLastSeen,
      };
    },
    [presenceMap]
  );

  return {
    presenceMap,
    getUserPresence,
    updateContactPresence,
  };
}
