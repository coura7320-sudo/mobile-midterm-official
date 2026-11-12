import { Response, NextFunction } from 'express';
import {
  conversationsStorage,
  messagesStorage,
  usersStorage,
  toPublicUser,
} from '../models/repositories';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';
import { ConversationRecord, PublicUser } from '../types';

export interface EnrichedConversation extends ConversationRecord {
  participants: PublicUser[];
  unreadCount: number;
}

export async function enrichConversation(
  conv: ConversationRecord,
  currentUserId: string
): Promise<EnrichedConversation> {
  const allUsers = await usersStorage.findAll();
  const userMap = new Map(allUsers.map((u) => [u.id, toPublicUser(u)]));
  const participants = conv.participantIds
    .map((id) => userMap.get(id))
    .filter((u): u is PublicUser => Boolean(u));

  const unreadMessages = await messagesStorage.findMany(
    (m) =>
      m.conversationId === conv.id &&
      m.senderId !== currentUserId &&
      !m.readBy.includes(currentUserId)
  );

  return {
    ...conv,
    participants,
    unreadCount: unreadMessages.length,
  };
}

export async function getConversations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const userConvs = await conversationsStorage.findMany((c) =>
      c.participantIds.includes(userId)
    );

    const enriched = await Promise.all(
      userConvs.map((c) => enrichConversation(c, userId))
    );

    enriched.sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return timeB - timeA;
    });

    res.status(200).json({
      success: true,
      conversations: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrCreateDirectConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { participantId } = req.body as { participantId?: string };

    if (!participantId || typeof participantId !== 'string') {
      throw new AppError('participantId is required.', 400);
    }
    if (participantId === userId) {
      throw new AppError('Cannot start a direct conversation with yourself.', 400);
    }

    const otherUser = await usersStorage.findById(participantId);
    if (!otherUser) {
      throw new AppError('Recipient user not found.', 404);
    }

    let existing = await conversationsStorage.findOne(
      (c) =>
        c.type === 'direct' &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(userId) &&
        c.participantIds.includes(participantId)
    );

    if (!existing) {
      const now = new Date().toISOString();
      existing = await conversationsStorage.create({
        type: 'direct',
        participantIds: [userId, participantId],
        archivedBy: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    const enriched = await enrichConversation(existing, userId);
    res.status(200).json({
      success: true,
      conversation: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleArchiveConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const convId = req.params.id;
    const conv = await conversationsStorage.findById(convId);

    if (!conv || !conv.participantIds.includes(userId)) {
      throw new AppError('Conversation not found.', 404);
    }

    const archivedBy = conv.archivedBy ?? [];
    const isArchived = archivedBy.includes(userId);
    const updatedArchivedBy = isArchived
      ? archivedBy.filter((id) => id !== userId)
      : [...archivedBy, userId];

    const updated = await conversationsStorage.updateById(convId, {
      archivedBy: updatedArchivedBy,
    });

    const enriched = await enrichConversation(updated ?? conv, userId);
    res.status(200).json({
      success: true,
      conversation: enriched,
    });
  } catch (error) {
    next(error);
  }
}
