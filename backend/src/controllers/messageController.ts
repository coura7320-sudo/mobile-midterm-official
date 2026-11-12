import { Response, NextFunction } from 'express';
import {
  conversationsStorage,
  messagesStorage,
} from '../models/repositories';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';

export async function getConversationMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const conv = await conversationsStorage.findById(conversationId);
    if (!conv || !conv.participantIds.includes(userId)) {
      throw new AppError('Conversation not found or access denied.', 404);
    }

    const messages = await messagesStorage.findMany(
      (m) => m.conversationId === conversationId
    );
    messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
}

export async function sendMessageRest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { conversationId, text } = req.body as {
      conversationId?: string;
      text?: string;
    };

    if (!conversationId || typeof text !== 'string' || !text.trim()) {
      throw new AppError('conversationId and non-empty text are required.', 400);
    }

    const conv = await conversationsStorage.findById(conversationId);
    if (!conv || !conv.participantIds.includes(userId)) {
      throw new AppError('Conversation not found or unauthorized.', 403);
    }

    const now = new Date().toISOString();
    const message = await messagesStorage.create({
      conversationId,
      senderId: userId,
      text: text.trim(),
      status: 'sent',
      deliveredTo: [userId],
      readBy: [userId],
      starredBy: [],
      createdAt: now,
    });

    await conversationsStorage.updateById(conversationId, {
      lastMessageId: message.id,
      lastMessageText: message.text,
      lastMessageAt: message.createdAt,
      updatedAt: now,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleStarMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const msg = await messagesStorage.findById(id);
    if (!msg) {
      throw new AppError('Message not found.', 404);
    }

    const starredBy = msg.starredBy ?? [];
    const updatedStarred = starredBy.includes(userId)
      ? starredBy.filter((uid) => uid !== userId)
      : [...starredBy, userId];

    const updated = await messagesStorage.updateById(id, {
      starredBy: updatedStarred,
    });

    res.status(200).json({
      success: true,
      message: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStarredMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const starred = await messagesStorage.findMany((m) =>
      (m.starredBy ?? []).includes(userId)
    );
    starred.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.status(200).json({
      success: true,
      messages: starred,
    });
  } catch (error) {
    next(error);
  }
}
