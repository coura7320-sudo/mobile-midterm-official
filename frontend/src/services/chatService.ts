import { apiRequest } from './api';
import { Conversation, Message, User, Group, StatusUpdate } from '../types';

export const chatService = {
  getContacts: () =>
    apiRequest<{ success: boolean; users: User[] }>('/api/users', {
      method: 'GET',
    }),

  getUserById: (userId: string) =>
    apiRequest<{ success: boolean; user: User }>(`/api/users/${userId}`, {
      method: 'GET',
    }),

  getConversations: () =>
    apiRequest<{ success: boolean; conversations: Conversation[] }>(
      '/api/conversations',
      { method: 'GET' }
    ),

  getOrCreateDirectConversation: (participantId: string) =>
    apiRequest<{ success: boolean; conversation: Conversation }>(
      '/api/conversations/direct',
      {
        method: 'POST',
        body: { participantId },
      }
    ),

  toggleArchiveConversation: (conversationId: string) =>
    apiRequest<{ success: boolean; conversation: Conversation }>(
      `/api/conversations/${conversationId}/archive`,
      { method: 'PATCH' }
    ),

  getMessages: (conversationId: string) =>
    apiRequest<{ success: boolean; messages: Message[] }>(
      `/api/messages/${conversationId}`,
      { method: 'GET' }
    ),

  sendMessageRest: (conversationId: string, text: string) =>
    apiRequest<{ success: boolean; message: Message }>('/api/messages', {
      method: 'POST',
      body: { conversationId, text },
    }),

  toggleStarMessage: (messageId: string) =>
    apiRequest<{ success: boolean; message: Message }>(
      `/api/messages/${messageId}/star`,
      { method: 'PATCH' }
    ),

  getStarredMessages: () =>
    apiRequest<{ success: boolean; messages: Message[] }>(
      '/api/messages/starred',
      { method: 'GET' }
    ),

  getGroups: () =>
    apiRequest<{ success: boolean; groups: (Group & { isMember?: boolean; members?: User[] })[] }>(
      '/api/groups',
      { method: 'GET' }
    ),

  createGroup: (payload: {
    name: string;
    description?: string;
    communityName?: string;
    memberIds: string[];
  }) =>
    apiRequest<{ success: boolean; group: Group; conversation: Conversation }>(
      '/api/groups',
      {
        method: 'POST',
        body: payload,
      }
    ),

  getStatuses: () =>
    apiRequest<{ success: boolean; statuses: StatusUpdate[] }>(
      '/api/statuses',
      { method: 'GET' }
    ),

  createStatus: (payload: { text: string; backgroundColor: string }) =>
    apiRequest<{ success: boolean; status: StatusUpdate }>('/api/statuses', {
      method: 'POST',
      body: payload,
    }),

  markStatusViewed: (statusId: string) =>
    apiRequest<{ success: boolean; status: StatusUpdate }>(
      `/api/statuses/${statusId}/view`,
      { method: 'PATCH' }
    ),
};
