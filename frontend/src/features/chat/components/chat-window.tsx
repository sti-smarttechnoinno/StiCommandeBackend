'use client';

import React from 'react';
import { ArrowLeft, User, Phone, Shield, Briefcase, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatContact, ChatMessage, Conversation } from '@/types/chat';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { formatLastSeen } from '../utils/date-utils';

interface ChatWindowProps {
  contact: ChatContact;
  conversation: Conversation | null;
  messages: ChatMessage[];
  currentUserId?: number;
  onSendMessage: (body: string) => Promise<void>;
  onBack?: () => void;
  getUserPresence: (userId: number, defaultOnline?: boolean, defaultLastSeen?: string | null) => {
    isOnline: boolean;
    lastSeenAt: string | null;
  };
  isLoadingMessages?: boolean;
  isSending?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  getUserPresence,
  isLoadingMessages,
  isSending,
}) => {
  const presence = getUserPresence(contact.id, contact.is_online, contact.last_seen_at);
  const isOnline = presence.isOnline;
  const lastSeenText = formatLastSeen(isOnline, presence.lastSeenAt);

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getRoleBadge = (role: string) => {
    if (role === 'delegate') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 hidden sm:inline-block">
          Délégué
        </span>
      );
    }
    if (role === 'commercial') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 hidden sm:inline-block">
          Commercial
        </span>
      );
    }
    if (role === 'admin' || role === 'administrator') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/80 hidden sm:inline-block">
          Administrateur
        </span>
      );
    }
    if (role === 'charge_compte') {
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 hidden sm:inline-block">
          Chargé de compte
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hidden sm:inline-block">
        {role}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200/90 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar with Presence Indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-950 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials}
            </div>
            <span
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                isOnline ? 'bg-green-500' : 'bg-gray-300'
              )}
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900 truncate">{contact.name}</h3>
              {getRoleBadge(contact.role)}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full',
                  isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-medium',
                  isOnline ? 'text-green-600' : 'text-gray-500'
                )}
              >
                {lastSeenText}
              </span>
              {contact.phone && (
                <span className="text-[11px] text-gray-400 hidden md:inline">
                  • {contact.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa]">
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
            Chargement des messages...
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            partnerName={contact.name}
          />
        )}
      </div>

      {/* Input Box */}
      <MessageInput onSend={onSendMessage} disabled={isSending} />
    </div>
  );
};
