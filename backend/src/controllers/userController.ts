import { Response, NextFunction } from 'express';
import { usersStorage, toPublicUser } from '../models/repositories';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AppError } from '../utils/AppError';

export async function getAllUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const currentUserId = req.user?.id;
    const allUsers = await usersStorage.findAll();
    const contacts = allUsers
      .filter((u) => u.id !== currentUserId)
      .map(toPublicUser);

    res.status(200).json({
      success: true,
      users: contacts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersStorage.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    res.status(200).json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized.', 401);
    }
    const { fullName, about, avatarUrl } = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      updates.fullName = fullName.trim();
    }
    if (typeof about === 'string' && about.trim().length > 0) {
      updates.about = about.trim();
    }
    if (typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
      updates.avatarUrl = avatarUrl.trim();
    }

    const updated = await usersStorage.updateById(userId, updates);
    if (!updated) {
      throw new AppError('User not found.', 404);
    }

    res.status(200).json({
      success: true,
      user: toPublicUser(updated),
    });
  } catch (error) {
    next(error);
  }
}
