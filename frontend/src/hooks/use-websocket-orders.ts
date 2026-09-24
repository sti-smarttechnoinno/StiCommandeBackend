'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/services/api';

export interface DelegateEvent {
  id: string;
  name: string;
  status: string;
  isOnline: boolean;
  lastActivity: string;
}

export interface OrderEvent {
  type: string;
  order?: {
    id: string;
    order_code: string;
    client_name: string;
    delegate_name: string;
    total_amount: number;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
  delegate?: DelegateEvent;
}

// Synthesize pleasant dual-tone audio chime using Web Audio API
function playChimeSound() {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Tone 1: 523.25 Hz (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Tone 2: 659.25 Hz (E5) delayed slightly
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (_) {
    // Graceful fallback if AudioContext is blocked by browser autoplay policy
  }
}

// Shared Singleton State across all components and hooks
interface SharedWebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  unvalidatedCount: number;
  lastEvent: OrderEvent | null;
  lastDelegateEvent: DelegateEvent | null;
  listeners: Set<() => void>;
  seenEventIds: Set<string>;
  reconnectTimer: NodeJS.Timeout | null;
  pollTimer: NodeJS.Timeout | null;
  windowListenersAttached: boolean;
}

const sharedState: SharedWebSocketState = {
  socket: null,
  isConnected: false,
  unvalidatedCount: 0,
  lastEvent: null,
  lastDelegateEvent: null,
  listeners: new Set(),
  seenEventIds: new Set(),
  reconnectTimer: null,
  pollTimer: null,
  windowListenersAttached: false,
};

function notifyListeners() {
  sharedState.listeners.forEach((listener) => listener());
}

/**
 * Authoritative count fetcher from the backend.
 * Reconciles the exact number of pending/unvalidated orders.
 */
export async function fetchUnvalidatedCountGlobal() {
  try {
    const apiBaseUrl = typeof window !== 'undefined' ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const res = await fetch(`${apiBaseUrl}/orders?status=pending&pageSize=1`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.total === 'number') {
        sharedState.unvalidatedCount = data.total;
        notifyListeners();
      }
    }
  } catch (_) {}
}

function handleSharedOrderEvent(data: OrderEvent) {
  if (data.type === 'DELEGATE_STATUS_CHANGED' && data.delegate) {
    sharedState.lastDelegateEvent = data.delegate;
    notifyListeners();
    return;
  }

  if (data.order) {
    const eventKey = `${data.type}-${data.order.id || data.order.order_code}-${data.order.status || ''}-${data.order.created_at || ''}`;
    if (sharedState.seenEventIds.has(eventKey)) return;
    sharedState.seenEventIds.add(eventKey);

    // Limit memory consumption
    if (sharedState.seenEventIds.size > 300) {
      const arr = Array.from(sharedState.seenEventIds);
      arr.slice(0, 150).forEach((k) => sharedState.seenEventIds.delete(k));
    }

    if (data.type === 'ORDER_CREATED') {
      if (data.order.status === 'pending') {
        sharedState.unvalidatedCount += 1;
      }
      fetchUnvalidatedCountGlobal();
    } else if (
      data.type === 'ORDER_UPDATED' ||
      data.type === 'ORDER_STATUS_CHANGED' ||
      data.type === 'ORDER_VALIDATED' ||
      data.type === 'ORDER_DELETED'
    ) {
      if (data.order.status && data.order.status !== 'pending' && sharedState.unvalidatedCount > 0) {
        sharedState.unvalidatedCount = Math.max(0, sharedState.unvalidatedCount - 1);
      } else if (data.order.status === 'pending') {
        sharedState.unvalidatedCount += 1;
      }
      fetchUnvalidatedCountGlobal();
    }

    sharedState.lastEvent = data;
    notifyListeners();

    // Sound & toast notifications for new orders
    if (data.type === 'ORDER_CREATED') {
      playChimeSound();
      const code = data.order.order_code || 'ORD';
      const client = data.order.client_name || 'Client';
      const amount = data.order.total_amount ? `${Number(data.order.total_amount).toLocaleString()} DA` : '';

      toast.success(`Nouvelle commande reçue !`, {
        description: `${code} — ${client} (${amount})`,
        duration: 6000,
      });
    }
  }
}

function attachWindowListeners() {
  if (typeof window === 'undefined' || sharedState.windowListenersAttached) return;
  sharedState.windowListenersAttached = true;

  const handleLocalOrderChange = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.status && detail.status !== 'pending' && sharedState.unvalidatedCount > 0) {
      sharedState.unvalidatedCount = Math.max(0, sharedState.unvalidatedCount - 1);
      notifyListeners();
    } else if (detail?.status === 'pending') {
      sharedState.unvalidatedCount += 1;
      notifyListeners();
    }
    fetchUnvalidatedCountGlobal();
  };

  window.addEventListener('sti-order-updated', handleLocalOrderChange);
  window.addEventListener('sti-order-created', handleLocalOrderChange);
  window.addEventListener('sti-order-deleted', handleLocalOrderChange);

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchUnvalidatedCountGlobal();
    }
  });

  window.addEventListener('focus', () => {
    fetchUnvalidatedCountGlobal();
  });
}

function initSharedWebSocket() {
  if (typeof window === 'undefined') return;

  attachWindowListeners();

  // Periodic fallback sync every 30 seconds
  if (!sharedState.pollTimer) {
    sharedState.pollTimer = setInterval(fetchUnvalidatedCountGlobal, 30000);
  }

  if (sharedState.socket && (sharedState.socket.readyState === WebSocket.OPEN || sharedState.socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const getWsUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${hostname}:8085`;
      }
    }
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8085';
  };

  const wsCustomUrl = getWsUrl();

  try {
    const ws = new WebSocket(wsCustomUrl);
    sharedState.socket = ws;

    ws.onopen = () => {
      sharedState.isConnected = true;
      notifyListeners();
      fetchUnvalidatedCountGlobal();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSharedOrderEvent(data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sti-websocket-event', { detail: data }));
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      sharedState.isConnected = false;
      sharedState.socket = null;
      notifyListeners();
      if (sharedState.reconnectTimer) clearTimeout(sharedState.reconnectTimer);
      sharedState.reconnectTimer = setTimeout(initSharedWebSocket, 8000);
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch (_) {}
    };
  } catch (_) {
    if (sharedState.reconnectTimer) clearTimeout(sharedState.reconnectTimer);
    sharedState.reconnectTimer = setTimeout(initSharedWebSocket, 8000);
  }
}

export function useWebSocketOrders() {
  const [, setTick] = useState(0);

  const refreshCount = useCallback(async () => {
    await fetchUnvalidatedCountGlobal();
  }, []);

  useEffect(() => {
    // Register listener for shared state changes
    const listener = () => setTick((t) => t + 1);
    sharedState.listeners.add(listener);

    // Initialize singleton socket and window listeners
    initSharedWebSocket();

    if (sharedState.unvalidatedCount === 0) {
      fetchUnvalidatedCountGlobal();
    }

    return () => {
      sharedState.listeners.delete(listener);
    };
  }, []);

  return {
    unvalidatedCount: sharedState.unvalidatedCount,
    lastEvent: sharedState.lastEvent,
    lastDelegateEvent: sharedState.lastDelegateEvent,
    isConnected: sharedState.isConnected,
    refreshCount,
  };
}
