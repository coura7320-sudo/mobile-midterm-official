export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  about: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface ConversationRecord {
  id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string;
  avatarUrl?: string;
  lastMessageId?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  archivedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageRecord {
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

export interface GroupRecord {
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

export interface StatusRecord {
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
