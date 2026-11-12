import { Response, NextFunction } from 'express';
import {
  groupsStorage,
  conversationsStorage,
  usersStorage,
  toPublicUser,
} from '../models/repositories';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';

export async function getGroups(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const allGroups = await groupsStorage.findAll();
    const allUsers = await usersStorage.findAll();
    const userMap = new Map(allUsers.map((u) => [u.id, toPublicUser(u)]));

    const enriched = allGroups.map((g) => ({
      ...g,
      isMember: g.memberIds.includes(userId),
      members: g.memberIds
        .map((id) => userMap.get(id))
        .filter(Boolean),
    }));

    res.status(200).json({
      success: true,
      groups: enriched,
    });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, description, communityName, memberIds } = req.body as {
      name?: string;
      description?: string;
      communityName?: string;
      memberIds?: string[];
    };

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Group name must be at least 2 characters.', 400);
    }

    const uniqueMembers = Array.from(
      new Set([userId, ...(Array.isArray(memberIds) ? memberIds : [])])
    );

    const now = new Date().toISOString();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim()
    )}&background=075E54&color=fff&bold=true`;

    const groupConv = await conversationsStorage.create({
      type: 'group',
      name: name.trim(),
      avatarUrl,
      participantIds: uniqueMembers,
      archivedBy: [],
      lastMessageText: `Group "${name.trim()}" created`,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const group = await groupsStorage.create({
      name: name.trim(),
      description:
        typeof description === 'string' && description.trim()
          ? description.trim()
          : 'Welcome to our WhatsApp group!',
      communityName:
        typeof communityName === 'string' && communityName.trim()
          ? communityName.trim()
          : 'General Community',
      avatarUrl,
      adminIds: [userId],
      memberIds: uniqueMembers,
      conversationId: groupConv.id,
      createdAt: now,
    });

    res.status(201).json({
      success: true,
      group,
      conversation: groupConv,
    });
  } catch (error) {
    next(error);
  }
}
