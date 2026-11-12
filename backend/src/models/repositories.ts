import { JsonStorageService } from '../services/jsonStorage';
import {
  UserRecord,
  ConversationRecord,
  MessageRecord,
  GroupRecord,
  StatusRecord,
  PublicUser,
} from '../types';

export const usersStorage = new JsonStorageService<UserRecord>('users.json');
export const conversationsStorage = new JsonStorageService<ConversationRecord>('conversations.json');
export const messagesStorage = new JsonStorageService<MessageRecord>('messages.json');
export const groupsStorage = new JsonStorageService<GroupRecord>('groups.json');
export const statusesStorage = new JsonStorageService<StatusRecord>('statuses.json');

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _removed, ...publicFields } = user;
  return publicFields;
}
