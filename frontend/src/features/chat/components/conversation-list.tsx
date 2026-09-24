'use client';

import React, { useState, useMemo } from 'react';
import { Search, UserCheck, Shield, Briefcase, Check, CheckCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatContact } from '@/types/chat';
import { formatMessageTime, formatDayDivider } from '../utils/date-utils';

interface ConversationListProps {
  contacts: ChatContact[];
  activeContactId?: number;
  onSelectContact: (contact: ChatContact) => void;
  getUserPresence: (userId: number, defaultOnline?: boolean, defaultLastSeen?: string | null) => {
    isOnline: boolean;
    lastSeenAt: string | null;
  };
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  getUserPresence,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'delegates' | 'commercials' | 'staff'>('all');

  const onlineCount = useMemo(() => {
    return contacts.filter((c) => getUserPresence(c.id, c.is_online, c.last_seen_at).isOnline).length;
  }, [contacts, getUserPresence]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const presence = getUserPresence(c.id, c.is_online, c.last_seen_at);
      const isOnline = presence.isOnline;

      if (filter === 'online' && !isOnline) return false;
      if (filter === 'delegates' && c.role !== 'delegate') return false;
      if (filter === 'commercials' && c.role !== 'commercial') return false;
      if (filter === 'staff' && (c.role === 'delegate' || c.role === 'commercial')) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q))
      );
    });
  }, [contacts, search, filter, getUserPresence]);

  const getRoleBadge = (role: string) => {
    if (role === 'delegate') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <Briefcase className="w-2.5 h-2.5 text-blue-600" /> Délégué
        </span>
      );
    }
    if (role === 'commercial') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          <Briefcase className="w-2.5 h-2.5 text-amber-600" /> Commercial
        </span>
      );
    }
    if (role === 'admin' || role === 'administrator') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
          <Shield className="w-2.5 h-2.5 text-purple-600" /> Admin
        </span>
      );
    }
    if (role === 'charge_compte') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <UserCheck className="w-2.5 h-2.5 text-emerald-600" /> Staff
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
        {role}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search Header */}
      <div className="p-3 border-b border-gray-200 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-100/80 border border-gray-200/80 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white text-gray-900 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0',
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Tous ({contacts.length})
          </button>
          <button
            onClick={() => setFilter('online')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1',
              filter === 'online'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            En ligne ({onlineCount})
          </button>
          <button
            onClick={() => setFilter('delegates')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0',
              filter === 'delegates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Délégués
          </button>
          <button
            onClick={() => setFilter('commercials')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0',
              filter === 'commercials'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Commerciaux
          </button>
          <button
            onClick={() => setFilter('staff')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-colors shrink-0',
              filter === 'staff'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Staff
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Chargement des contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">Aucun contact trouvé</div>
        ) : (
          filteredContacts.map((contact) => {
            const presence = getUserPresence(contact.id, contact.is_online, contact.last_seen_at);
            const isOnline = presence.isOnline;
            const isSelected = contact.id === activeContactId;
            const lastMsg = contact.latest_message;
            const initials = contact.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  'w-full text-left px-3.5 py-3 flex items-start gap-3 transition-colors relative hover:bg-gray-50/80',
                  isSelected && 'bg-red-50/70 border-l-4 border-l-red-600'
                )}
              >
                {/* Avatar with Presence Ring */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {initials}
                  </div>
                  {/* Presence Dot */}
                  <span
                    className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                      isOnline ? 'bg-green-500' : 'bg-gray-300'
                    )}
                    title={isOnline ? 'En ligne' : 'Hors ligne'}
                  >
                    {isOnline && (
                      <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                    )}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-gray-900 truncate">
                      {contact.name}
                    </span>
                    {lastMsg?.created_at && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatMessageTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="truncate text-xs text-gray-500 flex items-center gap-1">
                      {/* Read status icon if sent by currentUser */}
                      {lastMsg && lastMsg.sender_id !== contact.id && (
                        <span>
                          {lastMsg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-400 inline shrink-0" />
                          )}
                        </span>
                      )}
                      <span className="truncate">
                        {lastMsg ? lastMsg.body : <span className="italic text-gray-400">Aucun message</span>}
                      </span>
                    </div>

                    {/* Unread badge */}
                    {contact.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shrink-0 shadow-2xs">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    {getRoleBadge(contact.role)}
                    {contact.department && (
                      <span className="text-[10px] text-gray-400 truncate">
                        • {contact.department}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
