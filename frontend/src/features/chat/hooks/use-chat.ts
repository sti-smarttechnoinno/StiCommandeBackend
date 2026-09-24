'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/services/chat';
import type {
  ChatContact,
  Conversation,
  ChatMessage,
  ChatMessageSentEvent,
  ChatMessagesViewedEvent,
} from '@/types/chat';

function playMessageSound() {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {
    // blocked by autoplay policy
  }
}

export function useChat(currentUserId?: number) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const activeConvIdRef = useRef<number | null>(null);
  activeConvIdRef.current = activeConversation?.id ?? null;

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setIsLoadingContacts(true);
      const data = await chatService.getContacts();
      setContacts(data.contacts);
      setTotalUnread(data.total_unread);
    } catch (e) {
      console.error('Failed to load chat contacts', e);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Select contact and initialize conversation
  const selectContact = useCallback(
    async (contact: ChatContact | null) => {
      if (!contact) {
        setActiveContact(null);
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      setActiveContact(contact);
      setIsLoadingMessages(true);

      try {
        let convId = contact.conversation_id;
        let conv: Conversation;

        if (convId) {
          conv = {
            id: convId,
            partner: {
              id: contact.id,
              name: contact.name,
              role: contact.role,
              is_online: contact.is_online,
              last_seen_at: contact.last_seen_at,
            },
            unread_count: contact.unread_count,
            last_message: contact.latest_message ?? null,
            last_message_at: contact.latest_message?.created_at ?? null,
          };
        } else {
          conv = await chatService.getOrCreateDirectConversation(contact.id);
          // Update contact with new conversation_id
          setContacts((prev) =>
            prev.map((c) => (c.id === contact.id ? { ...c, conversation_id: conv.id } : c))
          );
        }

        setActiveConversation(conv);

        // Fetch messages
        const msgs = await chatService.getMessages(conv.id);
        const hasUnread =
          msgs.some((m) => m.sender_id !== currentUserId && !m.is_read) ||
          (contact.unread_count && contact.unread_count > 0);

        if (hasUnread) {
          const readNow = new Date().toISOString();
          const readMsgs = msgs.map((m) =>
            m.sender_id !== currentUserId && !m.is_read
              ? { ...m, is_read: true, read_at: readNow }
              : m
          );
          setMessages(readMsgs);

          // Mark as read on backend and broadcast to partner
          chatService.markAsRead(conv.id).catch((err) => {
            console.warn('Failed to mark conversation as read', err);
          });

          // Reset unread count for this contact
          setContacts((prev) =>
            prev.map((c) => (c.id === contact.id ? { ...c, unread_count: 0 } : c))
          );
          setTotalUnread((prev) => Math.max(0, prev - (contact.unread_count || 0)));
        } else {
          setMessages(msgs);
        }
      } catch (e) {
        console.error('Failed to load conversation messages', e);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  // Send message
  const sendMessage = useCallback(
    async (body: string) => {
      if (!body.trim() || !activeConversation || !currentUserId) return;

      const trimmedBody = body.trim();
      const tempId = Date.now();
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: activeConversation.id,
        sender_id: currentUserId,
        body: trimmedBody,
        is_read: false,
        read_at: null,
        delivered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);

      try {
        const savedMsg = await chatService.sendMessage(activeConversation.id, {
          body: trimmedBody,
        });

        // Replace optimistic message
        setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMsg : m)));

        // Update last message in contacts list
        setContacts((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.partner.id) {
              return {
                ...c,
                latest_message: {
                  id: savedMsg.id,
                  body: savedMsg.body,
                  sender_id: currentUserId,
                  is_read: false,
                  read_at: null,
                  created_at: savedMsg.created_at,
                },
              };
            }
            return c;
          })
        );
      } catch (e) {
        console.error('Failed to send message', e);
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation, currentUserId]
  );

  // WebSocket message listener
  useEffect(() => {
    const handleWsEvent = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!data || !data.type) return;

      if (data.type === 'CHAT_MESSAGE_SENT') {
        const sentEvent = data as ChatMessageSentEvent;
        const msg = sentEvent.message;

        // Check if message belongs to current user
        if (currentUserId && msg.sender_id === currentUserId) {
          // Handled by optimistic sender
          return;
        }

        playMessageSound();

        // If conversation is currently active
        const currentActiveId = activeConvIdRef.current;
        if (currentActiveId && Number(currentActiveId) === Number(sentEvent.conversation_id)) {
          const readTime = new Date().toISOString();
          const readMsg: ChatMessage = {
            ...msg,
            is_read: true,
            read_at: readTime,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, readMsg];
          });

          // Mark as read immediately on backend since user is actively viewing the conversation
          chatService.markAsRead(sentEvent.conversation_id).catch(() => {});
        } else {
          // Increase unread count for that contact
          setContacts((prev) =>
            prev.map((c) => {
              if (c.id === msg.sender_id) {
                return {
                  ...c,
                  unread_count: c.unread_count + 1,
                  latest_message: {
                    id: msg.id,
                    body: msg.body,
                    sender_id: msg.sender_id,
                    is_read: false,
                    read_at: null,
                    created_at: msg.created_at,
                  },
                };
              }
              return c;
            })
          );
          setTotalUnread((prev) => prev + 1);
        }
      }

      if (data.type === 'CHAT_MESSAGES_VIEWED') {
        const viewedEvent = data as ChatMessagesViewedEvent;
        const convId = Number(viewedEvent.conversation_id);
        const readAt = viewedEvent.read_at || new Date().toISOString();
        const idSet = Array.isArray(viewedEvent.message_ids)
          ? new Set(viewedEvent.message_ids.map(Number))
          : null;

        // 1. If active conversation matches, update outgoing messages to viewed
        const currentActiveId = activeConvIdRef.current;
        if (currentActiveId && Number(currentActiveId) === convId) {
          setMessages((prev) =>
            prev.map((m) => {
              const isOutgoing = currentUserId ? m.sender_id === currentUserId : true;
              const matchesId = idSet ? idSet.has(Number(m.id)) : true;

              if (isOutgoing && (matchesId || !m.is_read)) {
                return {
                  ...m,
                  is_read: true,
                  read_at: m.read_at || readAt,
                };
              }
              return m;
            })
          );
        }

        // 2. Also update sidebar contacts list
        setContacts((prev) =>
          prev.map((c) => {
            if (Number(c.conversation_id) === convId && c.latest_message) {
              return {
                ...c,
                latest_message: {
                  ...c.latest_message,
                  is_read: true,
                  read_at: c.latest_message.read_at || readAt,
                },
              };
            }
            return c;
          })
        );
      }
    };

    window.addEventListener('sti-websocket-event', handleWsEvent);

    // Re-mark as read if user focuses the window with an active conversation
    const handleWindowFocus = () => {
      const activeId = activeConvIdRef.current;
      if (activeId) {
        chatService.markAsRead(activeId).catch(() => {});
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('sti-websocket-event', handleWsEvent);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentUserId]);

  return {
    contacts,
    activeContact,
    activeConversation,
    messages,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    totalUnread,
    selectContact,
    sendMessage,
    refreshContacts: fetchContacts,
  };
}
