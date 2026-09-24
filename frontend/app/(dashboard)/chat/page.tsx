'use client';

import React from 'react';
import { ChatContainer } from '@/features/chat/components/chat-container';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Messagerie & Échanges
              </h1>
              <p className="text-xs text-gray-500">
                Communication directe entre le personnel, les délégués et les commerciaux
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Échanges sécurisés et synchronisés en temps réel</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <ChatContainer />
    </div>
  );
}
