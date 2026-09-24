'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';
import { MessageBubble } from './message-bubble';
import { groupMessagesByDay } from '../utils/date-utils';
import { MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId?: number;
  partnerName: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  partnerName,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h4 className="font-semibold text-gray-800 text-base mb-1">
          Démarrez la conversation avec {partnerName}
        </h4>
        <p className="text-xs text-gray-500 max-w-xs">
          Envoyez un message direct pour communiquer en temps réel avec statut de lecture et présence.
        </p>
      </div>
    );
  }

  const grouped = groupMessagesByDay(messages);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {grouped.map((group, groupIdx) => (
        <div key={`group-${groupIdx}`} className="space-y-1">
          {/* Day Divider */}
          <div className="flex items-center justify-center my-3 select-none">
            <span className="px-3 py-1 text-[11px] font-medium text-gray-600 bg-gray-100/90 border border-gray-200/80 rounded-full shadow-2xs">
              {group.dateLabel}
            </span>
          </div>

          {/* Messages in this day */}
          {group.messages.map((msg) => (
            <MessageBubble
              key={`msg-${msg.id}`}
              message={msg}
              isOutgoing={msg.sender_id === currentUserId}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
