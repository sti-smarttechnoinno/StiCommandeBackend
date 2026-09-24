import api from './api';
import type {
  ChatContact,
  ContactsResponse,
  ConversationsResponse,
  Conversation,
  DirectConversationResponse,
  MessagesResponse,
  ChatMessage,
  SendMessagePayload,
  MarkReadResponse,
} from '@/types/chat';

export const chatService = {
  async getContacts(): Promise<ContactsResponse> {
    const { data } = await api.get<ContactsResponse>('/chat/contacts');
    return data;
  },

  async getConversations(): Promise<ConversationsResponse> {
    const { data } = await api.get<ConversationsResponse>('/chat/conversations');
    return data;
  },

  async getOrCreateDirectConversation(userId: number): Promise<Conversation> {
    const { data } = await api.post<DirectConversationResponse>(`/chat/conversations/direct/${userId}`);
    return data.conversation;
  },

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    const { data } = await api.get<MessagesResponse>(`/chat/conversations/${conversationId}/messages`);
    return data.messages;
  },

  async sendMessage(conversationId: number, payload: SendMessagePayload): Promise<ChatMessage> {
    const { data } = await api.post<{ message: ChatMessage }>(
      `/chat/conversations/${conversationId}/messages`,
      payload
    );
    return data.message;
  },

  async markAsRead(conversationId: number): Promise<MarkReadResponse> {
    const { data } = await api.put<MarkReadResponse>(`/chat/conversations/${conversationId}/read`);
    return data;
  },

  async pingPresence(): Promise<{ status: string; last_seen_at: string }> {
    const { data } = await api.post<{ status: string; last_seen_at: string }>('/chat/presence/ping');
    return data;
  },
};
