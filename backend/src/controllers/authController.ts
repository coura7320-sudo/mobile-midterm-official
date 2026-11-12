import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { usersStorage, toPublicUser } from '../models/repositories';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

function buildDefaultAvatar(fullName: string): string {
  const encoded = encodeURIComponent(fullName.trim() || 'User');
  return `https://ui-avatars.com/api/?name=${encoded}&background=128C7E&color=fff&bold=true`;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, email, password, confirmPassword } = req.body as Record<string, unknown>;
    const errors: Record<string, string> = {};

    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';
    const rawConfirm = typeof confirmPassword === 'string' ? confirmPassword : '';

    if (cleanName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (rawPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (rawConfirm !== rawPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError('Validation failed.', 400, errors);
    }

    const existing = await usersStorage.findOne(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, {
        email: 'Email is already registered.',
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
    const now = new Date().toISOString();

    const createdUser = await usersStorage.create({
      fullName: cleanName,
      email: cleanEmail,
      passwordHash,
      avatarUrl: buildDefaultAvatar(cleanName),
      about: 'Hey there! I am using WhatsApp.',
      isOnline: true,
      lastSeen: now,
      createdAt: now,
    });

    const publicUser = toPublicUser(createdUser);
    const token = signToken({ userId: publicUser.id, email: publicUser.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: publicUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as Record<string, unknown>;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';

    if (!cleanEmail || !rawPassword) {
      throw new AppError('Email and password are required.', 400);
    }

    const userRecord = await usersStorage.findOne(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (!userRecord) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(rawPassword, userRecord.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const updatedUser =
      (await usersStorage.updateById(userRecord.id, {
        isOnline: true,
        lastSeen: new Date().toISOString(),
      })) ?? userRecord;

    const publicUser = toPublicUser(updatedUser);
    const token = signToken({ userId: publicUser.id, email: publicUser.email });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: publicUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized.', 401);
    }
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}
