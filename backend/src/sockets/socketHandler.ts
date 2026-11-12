import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import {
  usersStorage,
  conversationsStorage,
  messagesStorage,
} from '../models/repositories';
import { MessageStatus } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

// Tracks active socket IDs per userId so a user is only marked offline when all their sockets disconnect
const activeUserSockets = new Map<string, Set<string>>();

function addUserSocket(userId: string, socketId: string): void {
  const existing = activeUserSockets.get(userId) ?? new Set<string>();
  existing.add(socketId);
  activeUserSockets.set(userId, existing);
}

function removeUserSocket(userId: string, socketId: string): boolean {
  const existing = activeUserSockets.get(userId);
  if (!existing) return true;
  existing.delete(socketId);
  if (existing.size === 0) {
    activeUserSockets.delete(userId);
    return true;
  }
  return false;
}

export function isUserCurrentlyOnline(userId: string): boolean {
  const sockets = activeUserSockets.get(userId);
  return Boolean(sockets && sockets.size > 0);
}

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  // 1. JWT Authentication Middleware for Socket Connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const authToken =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers?.authorization?.replace('Bearer ', '') as
          | string
          | undefined);

      if (!authToken) {
        return next(new Error('Authentication error: missing JWT token'));
      }

      const decoded = verifyToken(authToken.trim());
      const user = await usersStorage.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: user not found'));
      }

      socket.userId = user.id;
      socket.userEmail = user.email;
      next();
    } catch {
      next(new Error('Authentication error: invalid or expired JWT token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    addUserSocket(userId, socket.id);

    // Join user-specific personal room
    socket.join(`user:${userId}`);

    // Automatically join all conversation rooms the user belongs to
    const userConversations = await conversationsStorage.findMany((c) =>
      c.participantIds.includes(userId)
    );
    for (const conv of userConversations) {
      socket.join(`conversation:${conv.id}`);
    }

    // Mark user online in persistent JSON storage & broadcast presence
    const nowIso = new Date().toISOString();
    await usersStorage.updateById(userId, {
      isOnline: true,
      lastSeen: nowIso,
    });
    io.emit('user:online', { userId, isOnline: true, lastSeen: nowIso });

    // Client-to-server: user:online
    socket.on('user:online', async () => {
      const ts = new Date().toISOString();
      await usersStorage.updateById(userId, { isOnline: true, lastSeen: ts });
      io.emit('user:online', { userId, isOnline: true, lastSeen: ts });
    });

    // Client-to-server: conversation:join
    socket.on(
      'conversation:join',
      async (payload: { conversationId?: string } | string) => {
        const conversationId =
          typeof payload === 'string' ? payload : payload?.conversationId;
        if (!conversationId) return;

        const conv = await conversationsStorage.findById(conversationId);
        if (!conv || !conv.participantIds.includes(userId)) {
          return;
        }
        socket.join(`conversation:${conversationId}`);
      }
    );

    // Client-to-server: conversation:leave
    socket.on(
      'conversation:leave',
      (payload: { conversationId?: string } | string) => {
        const conversationId =
          typeof payload === 'string' ? payload : payload?.conversationId;
        if (!conversationId) return;
        socket.leave(`conversation:${conversationId}`);
      }
    );

    // Client-to-server: message:send
    socket.on(
      'message:send',
      async (
        payload: {
          conversationId?: string;
          text?: string;
          tempId?: string;
        },
        ack?: (response: {
          success: boolean;
          message?: unknown;
          error?: string;
        }) => void
      ) => {
        try {
          const conversationId = payload?.conversationId;
          const text =
            typeof payload?.text === 'string' ? payload.text.trim() : '';

          // 1. Validate sender & payload
          if (!userId || !conversationId || !text) {
            ack?.({
              success: false,
              error: 'conversationId and non-empty text are required.',
            });
            return;
          }

          // 2. Verify conversation membership
          const conv = await conversationsStorage.findById(conversationId);
          if (!conv || !conv.participantIds.includes(userId)) {
            ack?.({
              success: false,
              error: 'Unauthorized: not a participant of this conversation.',
            });
            return;
          }

          socket.join(`conversation:${conversationId}`);

          // Check if any other participant is currently connected
          const otherParticipantIds = conv.participantIds.filter(
            (id) => id !== userId
          );
          const onlineRecipientIds = otherParticipantIds.filter((id) =>
            isUserCurrentlyOnline(id)
          );

          const initialStatus: MessageStatus =
            onlineRecipientIds.length > 0 ? 'delivered' : 'sent';
          const deliveredTo = [userId, ...onlineRecipientIds];
          const createdAt = new Date().toISOString();

          // 3 & 4. Generate UUID and save message in messages.json
          const savedMessage = await messagesStorage.create({
            conversationId,
            senderId: userId,
            text,
            status: initialStatus,
            deliveredTo,
            readBy: [userId],
            starredBy: [],
            createdAt,
          });

          // Update conversation lastMessage metadata in conversations.json
          await conversationsStorage.updateById(conversationId, {
            lastMessageId: savedMessage.id,
            lastMessageText: savedMessage.text,
            lastMessageAt: savedMessage.createdAt,
            updatedAt: createdAt,
          });

          // 6. Confirm successful sending to sender (message:sent)
          socket.emit('message:sent', {
            tempId: payload?.tempId,
            message: savedMessage,
          });

          // 5. Broadcast message:new to all authorized conversation members
          for (const participantId of conv.participantIds) {
            io.to(`user:${participantId}`).emit('message:new', savedMessage);
          }

          // 7. If already delivered to online recipients, emit message:delivered
          if (onlineRecipientIds.length > 0) {
            for (const participantId of conv.participantIds) {
              io.to(`user:${participantId}`).emit('message:delivered', {
                conversationId,
                messageId: savedMessage.id,
                status: 'delivered' as MessageStatus,
                userId: onlineRecipientIds[0],
              });
            }
          }

          ack?.({ success: true, message: savedMessage });
        } catch (err) {
          ack?.({
            success: false,
            error: (err as Error).message || 'Failed to send message.',
          });
        }
      }
    );

    // Client-to-server: message:delivered
    socket.on(
      'message:delivered',
      async (payload: { conversationId?: string; messageId?: string }) => {
        const { conversationId, messageId } = payload || {};
        if (!conversationId || !messageId) return;

        const msg = await messagesStorage.findById(messageId);
        if (!msg || msg.senderId === userId) return;

        const deliveredTo = msg.deliveredTo.includes(userId)
          ? msg.deliveredTo
          : [...msg.deliveredTo, userId];
        const nextStatus: MessageStatus =
          msg.status === 'read' ? 'read' : 'delivered';

        await messagesStorage.updateById(messageId, {
          status: nextStatus,
          deliveredTo,
        });

        const conv = await conversationsStorage.findById(conversationId);
        if (!conv) return;

        for (const participantId of conv.participantIds) {
          io.to(`user:${participantId}`).emit('message:delivered', {
            conversationId,
            messageId,
            status: nextStatus,
            userId,
          });
        }
      }
    );

    // Client-to-server: message:read
    socket.on(
      'message:read',
      async (payload: { conversationId?: string; messageId?: string }) => {
        const { conversationId, messageId } = payload || {};
        if (!conversationId) return;

        const conv = await conversationsStorage.findById(conversationId);
        if (!conv || !conv.participantIds.includes(userId)) return;

        const unreadMessages = await messagesStorage.findMany(
          (m) =>
            m.conversationId === conversationId &&
            m.senderId !== userId &&
            (!messageId || m.id === messageId) &&
            !m.readBy.includes(userId)
        );

        for (const msg of unreadMessages) {
          const deliveredTo = msg.deliveredTo.includes(userId)
            ? msg.deliveredTo
            : [...msg.deliveredTo, userId];
          const readBy = msg.readBy.includes(userId)
            ? msg.readBy
            : [...msg.readBy, userId];

          await messagesStorage.updateById(msg.id, {
            status: 'read',
            deliveredTo,
            readBy,
          });

          for (const participantId of conv.participantIds) {
            io.to(`user:${participantId}`).emit('message:read', {
              conversationId,
              messageId: msg.id,
              status: 'read' as MessageStatus,
              userId,
            });
          }
        }
      }
    );

    // Client-to-server: typing:start
    socket.on('typing:start', async (payload: { conversationId?: string }) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      const conv = await conversationsStorage.findById(conversationId);
      if (!conv || !conv.participantIds.includes(userId)) return;

      for (const participantId of conv.participantIds) {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('typing:update', {
            conversationId,
            userId,
            isTyping: true,
          });
        }
      }
    });

    // Client-to-server: typing:stop
    socket.on('typing:stop', async (payload: { conversationId?: string }) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      const conv = await conversationsStorage.findById(conversationId);
      if (!conv || !conv.participantIds.includes(userId)) return;

      for (const participantId of conv.participantIds) {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit('typing:update', {
            conversationId,
            userId,
            isTyping: false,
          });
        }
      }
    });

    // Disconnection handling
    socket.on('disconnect', async () => {
      const isCompletelyOffline = removeUserSocket(userId, socket.id);
      if (isCompletelyOffline) {
        const lastSeen = new Date().toISOString();
        await usersStorage.updateById(userId, {
          isOnline: false,
          lastSeen,
        });
        io.emit('user:offline', {
          userId,
          isOnline: false,
          lastSeen,
        });
      }
    });
  });

  return io;
}
