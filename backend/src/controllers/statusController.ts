import { Response, NextFunction } from 'express';
import { statusesStorage } from '../models/repositories';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';

export async function getStatuses(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = Date.now();
    const activeStatuses = await statusesStorage.findMany(
      (s) => new Date(s.expiresAt).getTime() > now
    );
    activeStatuses.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      success: true,
      statuses: activeStatuses,
    });
  } catch (error) {
    next(error);
  }
}

export async function createStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { text, backgroundColor } = req.body as {
      text?: string;
      backgroundColor?: string;
    };

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new AppError('Status text is required.', 400);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const status = await statusesStorage.create({
      userId: user.id,
      userName: user.fullName,
      userAvatar: user.avatarUrl,
      text: text.trim(),
      backgroundColor:
        typeof backgroundColor === 'string' && backgroundColor.trim()
          ? backgroundColor.trim()
          : '#075E54',
      viewedBy: [user.id],
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    res.status(201).json({
      success: true,
      status,
    });
  } catch (error) {
    next(error);
  }
}

export async function markStatusViewed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const status = await statusesStorage.findById(id);
    if (!status) {
      throw new AppError('Status not found.', 404);
    }

    const viewedBy = status.viewedBy.includes(userId)
      ? status.viewedBy
      : [...status.viewedBy, userId];

    const updated = await statusesStorage.updateById(id, { viewedBy });
    res.status(200).json({
      success: true,
      status: updated,
    });
  } catch (error) {
    next(error);
  }
}
