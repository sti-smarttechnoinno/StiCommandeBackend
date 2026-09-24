export interface ChatSender {
  id: number;
  name: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  created_at: string;
  sender?: ChatSender;
  is_optimistic?: boolean;
}

export interface LatestMessageSnippet {
  id: number;
  body: string;
  sender_id: number;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ChatContact {
  id: number;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  region?: string;
  wilaya?: string;
  is_online: boolean;
  last_seen_at: string | null;
  conversation_id?: number;
  unread_count: number;
  latest_message?: LatestMessageSnippet | null;
}

export interface ChatPartner {
  id: number;
  name: string;
  role: string;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface Conversation {
  id: number;
  partner: ChatPartner;
  unread_count: number;
  last_message: LatestMessageSnippet | null;
  last_message_at: string | null;
}

export interface ContactsResponse {
  contacts: ChatContact[];
  total_unread: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface DirectConversationResponse {
  conversation: Conversation;
}

export interface MessagesResponse {
  messages: ChatMessage[];
}

export interface SendMessagePayload {
  body: string;
  attachment_url?: string;
  attachment_type?: string;
}

export interface MarkReadResponse {
  success: boolean;
  viewed_count: number;
  read_at: string;
  message_ids: number[];
}

export interface ChatMessageSentEvent {
  type: 'CHAT_MESSAGE_SENT';
  conversation_id: number;
  recipient_id: number;
  message: ChatMessage;
}

export interface ChatMessagesViewedEvent {
  type: 'CHAT_MESSAGES_VIEWED';
  conversation_id: number;
  reader_id: number;
  read_at: string;
  message_ids: number[];
}

export interface UserStatusChangedEvent {
  type: 'USER_STATUS_CHANGED';
  user: {
    id: string;
    name: string;
    role: string;
    status: string;
    isOnline: boolean;
    last_seen_at: string;
  };
}

export type ChatRealtimeEvent =
  | ChatMessageSentEvent
  | ChatMessagesViewedEvent
  | UserStatusChangedEvent;
