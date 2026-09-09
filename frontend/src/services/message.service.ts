import { io, Socket } from 'socket.io-client';
import { api } from './api';

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isReacted: boolean;
  sentAt: string;
  readAt: string | null;
  attachments: MessageAttachment[];
}

export interface ConversationParticipant {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  role: string;
  roomName?: string | null;
  boardingHouseName?: string | null;
}

export interface ContactItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  role: string;
  roomName?: string | null;
  boardingHouseName?: string | null;
}

export interface ConversationItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  participant: ConversationParticipant;
  lastMessage?: MessageItem | null;
  unreadCount: number;
}


export interface SendMessagePayload {
  content: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    sizeBytes?: number;
    sortOrder?: number;
  }[];
}

export interface QueryMessagesParams {
  page?: number;
  limit?: number;
  before?: string;
}

function getSocketHost(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const port = process.env.NEXT_PUBLIC_API_PORT?.trim() || '3001';
  if (!envUrl) {
    return `http://localhost:${port}`;
  }
  return envUrl.replace(/\/api\/?$/, '');
}

/**
 * Creates and initializes a Socket.IO client instance for real-time messaging.
 */
export function initMessagesSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  const host = getSocketHost();

  const socket = io(`${host}/messages`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

/**
 * Retrieves all conversations for current user.
 */
export async function getConversations(): Promise<ConversationItem[]> {
  const res = await api.get<any>('/v1/messages/conversations');
  const payload = res?.data ?? res;
  return Array.isArray(payload) ? payload : [];
}

/**
 * Retrieves or opens a conversation with another user.
 */
export async function getOrCreateConversation(
  participantId: string,
  initialMessage?: string,
): Promise<ConversationItem> {
  const res = await api.post<any>('/v1/messages/conversations', {
    participantId,
    initialMessage,
  });
  return res?.data ?? res;
}

/**
 * Retrieves messages for a specific conversation.
 */
export async function getConversationMessages(
  conversationId: string,
  query?: QueryMessagesParams,
): Promise<MessageItem[]> {
  const params: Record<string, string> = {};
  if (query?.limit) params.limit = String(query.limit);
  if (query?.before) params.before = query.before;

  const res = await api.get<any>(`/v1/messages/conversations/${conversationId}/messages`, {
    params,
  });
  const payload = res?.data ?? res;
  return Array.isArray(payload) ? payload : [];
}

/**
 * Sends a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
): Promise<MessageItem> {
  const res = await api.post<any>(`/v1/messages/conversations/${conversationId}/messages`, payload);
  return res?.data ?? res;
}

/**
 * Marks messages in a conversation as read.
 */
export async function markAsRead(
  conversationId: string,
): Promise<{ success: boolean; count: number }> {
  const res = await api.patch<any>(`/v1/messages/conversations/${conversationId}/read`);
  return res?.data ?? res;
}

/**
 * Retrieves directory of contacts for starting conversations.
 */
export async function getContacts(): Promise<ContactItem[]> {
  const res = await api.get<any>('/v1/messages/contacts');
  const payload = res?.data ?? res;
  return Array.isArray(payload) ? payload : [];
}

