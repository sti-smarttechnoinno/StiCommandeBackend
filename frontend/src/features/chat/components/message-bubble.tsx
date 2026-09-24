'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';
import { formatMessageTime } from '../utils/date-utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isOutgoing: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOutgoing }) => {
  const time = formatMessageTime(message.created_at);

  const renderStatus = () => {
    if (!isOutgoing) return null;

    if (message.is_optimistic) {
      return <Clock className="w-3 h-3 text-white/70 animate-spin" />;
    }

    if (message.is_read) {
      const readTime = message.read_at ? formatMessageTime(message.read_at) : '';
      return (
        <span
          className="inline-flex items-center gap-1 bg-black/25 text-cyan-200 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-cyan-300/30 shadow-2xs"
          title={readTime ? `Vu par le destinataire à ${readTime}` : 'Message vu par le destinataire'}
        >
          <CheckCheck className="w-3.5 h-3.5 text-cyan-300 font-bold" />
          <span>Vu{readTime ? ` ${readTime}` : ''}</span>
        </span>
      );
    }

    if (message.delivered_at) {
      return (
        <span className="inline-flex items-center gap-0.5" title="Distribué (non lu)">
          <CheckCheck className="w-3.5 h-3.5 text-white/80" />
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-0.5" title="Envoyé">
        <Check className="w-3.5 h-3.5 text-white/70" />
      </span>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full my-1.5',
        isOutgoing ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[82%] sm:max-w-[70%] px-3.5 py-2 text-sm shadow-xs break-words',
          isOutgoing
            ? 'bg-red-600 text-white rounded-2xl rounded-tr-xs'
            : 'bg-white text-gray-900 border border-gray-200/90 rounded-2xl rounded-tl-xs'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed select-text">{message.body}</p>

        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1 select-none text-[11px]',
            isOutgoing ? 'text-white/80' : 'text-gray-500'
          )}
        >
          <span>{time}</span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};
