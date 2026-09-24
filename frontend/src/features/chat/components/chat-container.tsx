'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useChat } from '../hooks/use-chat';
import { useChatPresence } from '../hooks/use-chat-presence';
import { ConversationList } from './conversation-list';
import { ChatWindow } from './chat-window';
import type { ChatContact } from '@/types/chat';
import { cn } from '@/lib/utils';

export const ChatContainer: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ? Number(user.id) : undefined;

  const {
    contacts,
    activeContact,
    activeConversation,
    messages,
    isLoadingContacts,
    isLoadingMessages,
    isSending,
    selectContact,
    sendMessage,
  } = useChat(currentUserId);

  const { getUserPresence } = useChatPresence();
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const handleSelectContact = (contact: ChatContact) => {
    selectContact(contact);
    setMobileView('chat');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  return (
    <div className="h-[calc(100vh-130px)] min-h-[500px] bg-white border border-gray-200/90 rounded-2xl shadow-sm flex overflow-hidden">
      {/* Sidebar: Conversation / Contacts List */}
      <div
        className={cn(
          'w-full lg:w-[340px] xl:w-[380px] shrink-0 h-full lg:block',
          mobileView === 'chat' ? 'hidden' : 'block'
        )}
      >
        <ConversationList
          contacts={contacts}
          activeContactId={activeContact?.id}
          onSelectContact={handleSelectContact}
          getUserPresence={getUserPresence}
          isLoading={isLoadingContacts}
        />
      </div>

      {/* Main Area: Chat Window OR Clean Placeholder */}
      <div
        className={cn(
          'flex-1 h-full min-w-0 lg:block',
          mobileView === 'list' ? 'hidden' : 'block'
        )}
      >
        {activeContact ? (
          <ChatWindow
            contact={activeContact}
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={sendMessage}
            onBack={handleBackToList}
            getUserPresence={getUserPresence}
            isLoadingMessages={isLoadingMessages}
            isSending={isSending}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/40">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 shadow-sm border border-red-100">
              <MessageSquare className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">
              Messagerie STI Distribution
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
              Sélectionnez une discussion dans la liste de gauche pour afficher les échanges et envoyer un message en temps réel.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Messagerie synchronisée en direct</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
