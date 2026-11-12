import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { usersStorage, toPublicUser } from '../models/repositories';
import { PublicUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}

export async function authenticateJwt(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is missing or malformed.', 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError('Authentication token is missing.', 401);
    }

    const decoded = verifyToken(token);
    const userRecord = await usersStorage.findById(decoded.userId);
    if (!userRecord) {
      throw new AppError('Authenticated user no longer exists.', 401);
    }

    req.user = toPublicUser(userRecord);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Invalid or expired authentication token.', 401));
  }
}
