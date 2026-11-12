export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  about: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  status: MessageStatus;
  deliveredTo: string[];
  readBy: string[];
  starredBy: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  participants?: User[];
  name?: string;
  avatarUrl?: string;
  lastMessageId?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  archivedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  communityName?: string;
  avatarUrl: string;
  adminIds: string[];
  memberIds: string[];
  conversationId: string;
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  backgroundColor: string;
  viewedBy: string[];
  createdAt: string;
  expiresAt: string;
}
