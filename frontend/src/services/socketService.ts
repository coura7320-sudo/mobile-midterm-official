import { io, Socket } from 'socket.io-client';
import { getBackendBaseUrl } from './api';
import { Message, MessageStatus } from '../types';

export interface SocketStatusPayload {
  conversationId: string;
  messageId: string;
  status: MessageStatus;
  userId: string;
}

export interface SocketPresencePayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface SocketTypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

class SocketClientManager {
  private socket: Socket | null = null;
  private activeConversationId: string | null = null;

  public connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    const baseUrl = getBackendBaseUrl();
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('user:online');
      if (this.activeConversationId) {
        this.socket?.emit('conversation:join', {
          conversationId: this.activeConversationId,
        });
      }
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeConversationId = null;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  public getActiveConversationId(): string | null {
    return this.activeConversationId;
  }

  public joinConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
    this.socket?.emit('conversation:join', { conversationId });
  }

  public leaveConversation(conversationId: string): void {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    this.socket?.emit('conversation:leave', { conversationId });
  }

  public sendMessage(
    conversationId: string,
    text: string
  ): Promise<Message | null> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve(null);
        return;
      }
      this.socket.emit(
        'message:send',
        { conversationId, text },
        (response: { success: boolean; message?: Message }) => {
          if (response?.success && response.message) {
            resolve(response.message);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  public emitDelivered(conversationId: string, messageId: string): void {
    this.socket?.emit('message:delivered', { conversationId, messageId });
  }

  public emitRead(conversationId: string, messageId?: string): void {
    this.socket?.emit('message:read', { conversationId, messageId });
  }

  public emitTypingStart(conversationId: string): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  public emitTypingStop(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }
}

export const socketService = new SocketClientManager();
