'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

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
};

function notifyListeners() {
  sharedState.listeners.forEach((listener) => listener());
}

function handleSharedOrderEvent(data: OrderEvent) {
  if (data.type === 'DELEGATE_STATUS_CHANGED' && data.delegate) {
    sharedState.lastDelegateEvent = data.delegate;
    notifyListeners();
    return;
  }

  if (data.order) {
    const eventId = String(data.order.id || data.order.order_code || `${Date.now()}-${Math.random()}`);
    if (sharedState.seenEventIds.has(eventId)) return;
    sharedState.seenEventIds.add(eventId);

    if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_STATUS_CHANGED') {
      if (data.order.status === 'pending') {
        sharedState.unvalidatedCount += 1;
      } else if (sharedState.unvalidatedCount > 0) {
        sharedState.unvalidatedCount -= 1;
      }
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

function initSharedWebSocket() {
  if (typeof window === 'undefined') return;
  if (sharedState.socket && (sharedState.socket.readyState === WebSocket.OPEN || sharedState.socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const wsCustomUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8085';

  try {
    const ws = new WebSocket(wsCustomUrl);
    sharedState.socket = ws;

    ws.onopen = () => {
      sharedState.isConnected = true;
      notifyListeners();
      if (sharedState.pollTimer) {
        clearInterval(sharedState.pollTimer);
        sharedState.pollTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: OrderEvent = JSON.parse(event.data);
        handleSharedOrderEvent(data);
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

  const fetchUnvalidatedCount = useCallback(async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiBaseUrl}/orders?status=pending&pageSize=1`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.total === 'number') {
          sharedState.unvalidatedCount = data.total;
          notifyListeners();
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    // Register listener for shared state changes
    const listener = () => setTick((t) => t + 1);
    sharedState.listeners.add(listener);

    // Initialize singleton socket (only 1 socket across all components)
    initSharedWebSocket();

    if (sharedState.unvalidatedCount === 0) {
      fetchUnvalidatedCount();
    }

    return () => {
      sharedState.listeners.delete(listener);
    };
  }, [fetchUnvalidatedCount]);

  return {
    unvalidatedCount: sharedState.unvalidatedCount,
    lastEvent: sharedState.lastEvent,
    lastDelegateEvent: sharedState.lastDelegateEvent,
    isConnected: sharedState.isConnected,
    refreshCount: fetchUnvalidatedCount,
  };
}
