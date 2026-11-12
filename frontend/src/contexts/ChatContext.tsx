import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { Conversation, Message, MessageStatus, User } from '../types';
import { chatService } from '../services/chatService';
import {
  socketService,
  SocketStatusPayload,
  SocketPresencePayload,
  SocketTypingPayload,
} from '../services/socketService';
import { sqliteService } from '../database/sqliteService';
import { useAuth } from './AuthContext';

export interface ChatState {
  conversations: Conversation[];
  contacts: User[];
  messagesByConversation: Record<string, Message[]>;
  starredMessages: Message[];
  onlineUserIds: string[];
  typingByConversation: Record<string, string[]>;
  isLoading: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

export type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | {
      type: 'SET_SYNC_STATE';
      payload: { isSyncing: boolean; lastSyncedAt?: string };
    }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'UPSERT_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CONTACTS'; payload: User[] }
  | {
      type: 'SET_MESSAGES';
      payload: { conversationId: string; messages: Message[] };
    }
  | {
      type: 'UPSERT_MESSAGE';
      payload: { message: Message; currentUserId?: string; isChatOpen?: boolean };
    }
  | {
      type: 'UPDATE_MESSAGE_STATUS';
      payload: {
        conversationId: string;
        messageId?: string;
        status: MessageStatus;
        userId?: string;
      };
    }
  | { type: 'CLEAR_UNREAD'; payload: { conversationId: string; userId: string } }
  | {
      type: 'SET_USER_PRESENCE';
      payload: { userId: string; isOnline: boolean; lastSeen?: string };
    }
  | {
      type: 'SET_TYPING';
      payload: { conversationId: string; userId: string; isTyping: boolean };
    }
  | { type: 'SET_STARRED_MESSAGES'; payload: Message[] }
  | { type: 'RESET_STATE' };

const initialChatState: ChatState = {
  conversations: [],
  contacts: [],
  messagesByConversation: {},
  starredMessages: [],
  onlineUserIds: [],
  typingByConversation: {},
  isLoading: false,
  isOffline: false,
  isSyncing: false,
  lastSyncedAt: null,
};

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const tA = new Date(a.lastMessageAt || a.updatedAt).getTime();
    const tB = new Date(b.lastMessageAt || b.updatedAt).getTime();
    return tB - tA;
  });
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };

    case 'SET_SYNC_STATE':
      return {
        ...state,
        isSyncing: action.payload.isSyncing,
        lastSyncedAt: action.payload.lastSyncedAt ?? state.lastSyncedAt,
      };

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: sortConversations(action.payload),
      };

    case 'UPSERT_CONVERSATION': {
      const exists = state.conversations.some(
        (c) => c.id === action.payload.id
      );
      const updated = exists
        ? state.conversations.map((c) =>
            c.id === action.payload.id ? { ...c, ...action.payload } : c
          )
        : [action.payload, ...state.conversations];
      return {
        ...state,
        conversations: sortConversations(updated),
      };
    }

    case 'SET_CONTACTS': {
      const onlineIds = action.payload
        .filter((u) => u.isOnline)
        .map((u) => u.id);
      return {
        ...state,
        contacts: action.payload,
        onlineUserIds: Array.from(new Set([...state.onlineUserIds, ...onlineIds])),
      };
    }

    case 'SET_MESSAGES': {
      const { conversationId, messages } = action.payload;
      const sorted = [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: sorted,
        },
      };
    }

    case 'UPSERT_MESSAGE': {
      const { message, currentUserId, isChatOpen } = action.payload;
      const existingList =
        state.messagesByConversation[message.conversationId] || [];
      const msgExists = existingList.some((m) => m.id === message.id);

      const nextMessages = msgExists
        ? existingList.map((m) => (m.id === message.id ? message : m))
        : [...existingList, message];

      const isIncoming =
        currentUserId && message.senderId !== currentUserId;

      const nextConversations = state.conversations.map((conv) => {
        if (conv.id !== message.conversationId) return conv;
        const currentUnread = conv.unreadCount || 0;
        const nextUnread =
          !msgExists && isIncoming && !isChatOpen
            ? currentUnread + 1
            : currentUnread;
        return {
          ...conv,
          lastMessageId: message.id,
          lastMessageText: message.text,
          lastMessageAt: message.createdAt,
          updatedAt: message.createdAt,
          unreadCount: nextUnread,
        };
      });

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: nextMessages,
        },
        conversations: sortConversations(nextConversations),
      };
    }

    case 'UPDATE_MESSAGE_STATUS': {
      const { conversationId, messageId, status, userId } = action.payload;
      const list = state.messagesByConversation[conversationId];
      if (!list) return state;

      const statusRank: Record<MessageStatus, number> = {
        sent: 1,
        delivered: 2,
        read: 3,
      };

      const updatedList = list.map((msg) => {
        if (messageId && msg.id !== messageId) return msg;
        const nextStatus =
          statusRank[status] > statusRank[msg.status] ? status : msg.status;
        const deliveredTo =
          userId && !msg.deliveredTo.includes(userId)
            ? [...msg.deliveredTo, userId]
            : msg.deliveredTo;
        const readBy =
          status === 'read' && userId && !msg.readBy.includes(userId)
            ? [...msg.readBy, userId]
            : msg.readBy;
        return {
          ...msg,
          status: nextStatus,
          deliveredTo,
          readBy,
        };
      });

      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: updatedList,
        },
      };
    }

    case 'CLEAR_UNREAD': {
      const { conversationId, userId } = action.payload;
      const nextConversations = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      const list = state.messagesByConversation[conversationId] || [];
      const nextMessages = list.map((m) =>
        m.senderId !== userId
          ? {
              ...m,
              status: 'read' as MessageStatus,
              readBy: m.readBy.includes(userId)
                ? m.readBy
                : [...m.readBy, userId],
            }
          : m
      );
      return {
        ...state,
        conversations: nextConversations,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: nextMessages,
        },
      };
    }

    case 'SET_USER_PRESENCE': {
      const { userId, isOnline, lastSeen } = action.payload;
      const nextOnlineIds = isOnline
        ? Array.from(new Set([...state.onlineUserIds, userId]))
        : state.onlineUserIds.filter((id) => id !== userId);

      const nextContacts = state.contacts.map((u) =>
        u.id === userId
          ? { ...u, isOnline, lastSeen: lastSeen || u.lastSeen }
          : u
      );

      const nextConversations = state.conversations.map((conv) => ({
        ...conv,
        participants: conv.participants?.map((p) =>
          p.id === userId
            ? { ...p, isOnline, lastSeen: lastSeen || p.lastSeen }
            : p
        ),
      }));

      return {
        ...state,
        onlineUserIds: nextOnlineIds,
        contacts: nextContacts,
        conversations: nextConversations,
      };
    }

    case 'SET_TYPING': {
      const { conversationId, userId, isTyping } = action.payload;
      const currentTyping = state.typingByConversation[conversationId] || [];
      const nextTyping = isTyping
        ? Array.from(new Set([...currentTyping, userId]))
        : currentTyping.filter((id) => id !== userId);

      return {
        ...state,
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: nextTyping,
        },
      };
    }

    case 'SET_STARRED_MESSAGES':
      return {
        ...state,
        starredMessages: action.payload,
      };

    case 'RESET_STATE':
      return initialChatState;

    default:
      return state;
  }
}

interface ChatContextValue extends ChatState {
  dispatch: React.Dispatch<ChatAction>;
  totalUnreadCount: number;
  refreshChatsAndContacts: () => Promise<void>;
  loadConversationMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, text: string) => Promise<Message>;
  startDirectConversation: (participantId: string) => Promise<Conversation>;
  toggleArchiveConversation: (conversationId: string) => Promise<void>;
  toggleStarMessage: (messageId: string, conversationId: string) => Promise<void>;
  loadStarredMessages: () => Promise<void>;
  markConversationRead: (conversationId: string) => void;
  joinConversationRoom: (conversationId: string) => void;
  leaveConversationRoom: (conversationId: string) => void;
  emitTypingStart: (conversationId: string) => void;
  emitTypingStop: (conversationId: string) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  const flushPendingOutbox = useCallback(async () => {
    const outbox = await sqliteService.getPendingOutbox();
    if (outbox.length === 0) return;

    for (const item of outbox) {
      try {
        const res = await chatService.sendMessageRest(
          item.conversationId,
          item.text
        );
        await sqliteService.removePendingMessage(item.tempId);
        await sqliteService.upsertMessage(res.message);
        dispatch({
          type: 'UPSERT_MESSAGE',
          payload: {
            message: res.message,
            currentUserId: user?.id,
            isChatOpen: true,
          },
        });
      } catch {
        // Still offline; stop flushing until next reconnect
        break;
      }
    }
  }, [user?.id]);

  const refreshChatsAndContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    dispatch({ type: 'SET_LOADING', payload: true });

    // 1. Offline-first hydration from local Expo SQLite
    try {
      await sqliteService.initDatabase();
      const [localConvs, localContacts] = await Promise.all([
        sqliteService.getConversations(),
        sqliteService.getContacts(),
      ]);
      if (localConvs.length > 0) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: localConvs });
      }
      if (localContacts.length > 0) {
        dispatch({ type: 'SET_CONTACTS', payload: localContacts });
      }
    } catch {}

    // 2. Network synchronization with Backend REST API -> Persist to SQLite
    dispatch({ type: 'SET_SYNC_STATE', payload: { isSyncing: true } });
    try {
      await flushPendingOutbox();

      const [convRes, usersRes] = await Promise.all([
        chatService.getConversations(),
        chatService.getContacts(),
      ]);

      dispatch({ type: 'SET_CONVERSATIONS', payload: convRes.conversations });
      dispatch({ type: 'SET_CONTACTS', payload: usersRes.users });
      dispatch({ type: 'SET_OFFLINE', payload: false });
      dispatch({
        type: 'SET_SYNC_STATE',
        payload: { isSyncing: false, lastSyncedAt: new Date().toISOString() },
      });

      await Promise.all([
        sqliteService.saveConversations(convRes.conversations),
        sqliteService.saveContacts(usersRes.users),
      ]);
    } catch {
      dispatch({ type: 'SET_OFFLINE', payload: true });
      dispatch({ type: 'SET_SYNC_STATE', payload: { isSyncing: false } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, flushPendingOutbox]);

  // Connect Socket.IO and register real-time listeners without duplicates
  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      socketService.disconnect();
      dispatch({ type: 'RESET_STATE' });
      return;
    }

    refreshChatsAndContacts();
    const socket = socketService.connect(token);

    const handleConnect = () => {
      dispatch({ type: 'SET_OFFLINE', payload: false });
      flushPendingOutbox();
    };

    const handleDisconnect = () => {
      dispatch({ type: 'SET_OFFLINE', payload: true });
    };

    const handleNewMessage = (message: Message) => {
      const activeConvId = socketService.getActiveConversationId();
      const isChatOpen = activeConvId === message.conversationId;

      dispatch({
        type: 'UPSERT_MESSAGE',
        payload: {
          message,
          currentUserId: user.id,
          isChatOpen,
        },
      });

      // Persist incoming/new message immediately in Expo SQLite
      sqliteService.upsertMessage(message);

      dispatch({
        type: 'SET_TYPING',
        payload: {
          conversationId: message.conversationId,
          userId: message.senderId,
          isTyping: false,
        },
      });

      if (message.senderId !== user.id) {
        if (isChatOpen) {
          socketService.emitRead(message.conversationId, message.id);
        } else {
          socketService.emitDelivered(message.conversationId, message.id);
        }
      }
    };

    const handleSentAck = (payload: { tempId?: string; message: Message }) => {
      if (payload?.message) {
        dispatch({
          type: 'UPSERT_MESSAGE',
          payload: {
            message: payload.message,
            currentUserId: user.id,
            isChatOpen: true,
          },
        });
        sqliteService.upsertMessage(payload.message);
      }
    };

    const handleDelivered = (payload: SocketStatusPayload) => {
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          status: 'delivered',
          userId: payload.userId,
        },
      });
      sqliteService.updateMessageStatus(payload.messageId, 'delivered');
    };

    const handleRead = (payload: SocketStatusPayload) => {
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          status: 'read',
          userId: payload.userId,
        },
      });
      sqliteService.updateMessageStatus(payload.messageId, 'read');
    };

    const handleUserOnline = (payload: SocketPresencePayload) => {
      dispatch({
        type: 'SET_USER_PRESENCE',
        payload: {
          userId: payload.userId,
          isOnline: true,
          lastSeen: payload.lastSeen,
        },
      });
    };

    const handleUserOffline = (payload: SocketPresencePayload) => {
      dispatch({
        type: 'SET_USER_PRESENCE',
        payload: {
          userId: payload.userId,
          isOnline: false,
          lastSeen: payload.lastSeen,
        },
      });
    };

    const handleTypingUpdate = (payload: SocketTypingPayload) => {
      dispatch({
        type: 'SET_TYPING',
        payload,
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:sent', handleSentAck);
    socket.on('message:delivered', handleDelivered);
    socket.on('message:read', handleRead);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleSentAck);
      socket.off('message:delivered', handleDelivered);
      socket.off('message:read', handleRead);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [isAuthenticated, user, token, refreshChatsAndContacts, flushPendingOutbox]);

  const loadConversationMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      // 1. Load cached messages from local SQLite first for instant UI display
      const cached = await sqliteService.getMessages(conversationId);
      if (cached.length > 0) {
        dispatch({
          type: 'SET_MESSAGES',
          payload: { conversationId, messages: cached },
        });
      }

      // 2. Fetch latest messages from Backend REST API and sync to SQLite
      try {
        const res = await chatService.getMessages(conversationId);
        dispatch({
          type: 'SET_MESSAGES',
          payload: { conversationId, messages: res.messages },
        });
        await sqliteService.saveMessages(res.messages);

        if (user) {
          dispatch({
            type: 'CLEAR_UNREAD',
            payload: { conversationId, userId: user.id },
          });
          socketService.emitRead(conversationId);
        }
        return res.messages;
      } catch {
        dispatch({ type: 'SET_OFFLINE', payload: true });
        return cached;
      }
    },
    [user]
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string): Promise<Message> => {
      // 1. Try real-time Socket.IO emission first
      if (socketService.isConnected()) {
        const socketMsg = await socketService.sendMessage(conversationId, text);
        if (socketMsg) {
          dispatch({
            type: 'UPSERT_MESSAGE',
            payload: {
              message: socketMsg,
              currentUserId: user?.id,
              isChatOpen: true,
            },
          });
          await sqliteService.upsertMessage(socketMsg);
          return socketMsg;
        }
      }

      // 2. Try REST fallback
      try {
        const res = await chatService.sendMessageRest(conversationId, text);
        dispatch({
          type: 'UPSERT_MESSAGE',
          payload: {
            message: res.message,
            currentUserId: user?.id,
            isChatOpen: true,
          },
        });
        await sqliteService.upsertMessage(res.message);
        return res.message;
      } catch {
        // 3. Offline mode: store locally in SQLite + pending_outbox for automatic sync on reconnect
        dispatch({ type: 'SET_OFFLINE', payload: true });
        const now = new Date().toISOString();
        const tempId = `local-${Date.now()}`;
        const offlineMsg: Message = {
          id: tempId,
          conversationId,
          senderId: user?.id || 'me',
          text,
          status: 'sent',
          deliveredTo: user?.id ? [user.id] : [],
          readBy: user?.id ? [user.id] : [],
          starredBy: [],
          createdAt: now,
        };
        dispatch({
          type: 'UPSERT_MESSAGE',
          payload: {
            message: offlineMsg,
            currentUserId: user?.id,
            isChatOpen: true,
          },
        });
        await sqliteService.upsertMessage(offlineMsg);
        await sqliteService.enqueuePendingMessage({
          tempId,
          conversationId,
          text,
          createdAt: now,
        });
        return offlineMsg;
      }
    },
    [user?.id]
  );

  const startDirectConversation = useCallback(
    async (participantId: string): Promise<Conversation> => {
      const res = await chatService.getOrCreateDirectConversation(participantId);
      dispatch({ type: 'UPSERT_CONVERSATION', payload: res.conversation });
      await sqliteService.upsertConversation(res.conversation);
      socketService.joinConversation(res.conversation.id);
      return res.conversation;
    },
    []
  );

  const toggleArchiveConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      const res = await chatService.toggleArchiveConversation(conversationId);
      dispatch({ type: 'UPSERT_CONVERSATION', payload: res.conversation });
      await sqliteService.upsertConversation(res.conversation);
    },
    []
  );

  const toggleStarMessage = useCallback(
    async (messageId: string, conversationId: string): Promise<void> => {
      const res = await chatService.toggleStarMessage(messageId);
      dispatch({
        type: 'UPSERT_MESSAGE',
        payload: {
          message: res.message,
          currentUserId: user?.id,
          isChatOpen: true,
        },
      });
      await sqliteService.upsertMessage(res.message);
      const currentList = state.messagesByConversation[conversationId] || [];
      const updatedList = currentList.map((m) =>
        m.id === messageId ? res.message : m
      );
      dispatch({
        type: 'SET_MESSAGES',
        payload: { conversationId, messages: updatedList },
      });
    },
    [state.messagesByConversation, user?.id]
  );

  const loadStarredMessages = useCallback(async () => {
    const res = await chatService.getStarredMessages();
    dispatch({ type: 'SET_STARRED_MESSAGES', payload: res.messages });
  }, []);

  const markConversationRead = useCallback(
    (conversationId: string) => {
      if (!user) return;
      dispatch({
        type: 'CLEAR_UNREAD',
        payload: { conversationId, userId: user.id },
      });
      socketService.emitRead(conversationId);
    },
    [user]
  );

  const joinConversationRoom = useCallback((conversationId: string) => {
    socketService.joinConversation(conversationId);
  }, []);

  const leaveConversationRoom = useCallback((conversationId: string) => {
    socketService.leaveConversation(conversationId);
  }, []);

  const emitTypingStart = useCallback((conversationId: string) => {
    socketService.emitTypingStart(conversationId);
  }, []);

  const emitTypingStop = useCallback((conversationId: string) => {
    socketService.emitTypingStop(conversationId);
  }, []);

  const totalUnreadCount = useMemo(() => {
    return state.conversations.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
  }, [state.conversations]);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      totalUnreadCount,
      refreshChatsAndContacts,
      loadConversationMessages,
      sendMessage,
      startDirectConversation,
      toggleArchiveConversation,
      toggleStarMessage,
      loadStarredMessages,
      markConversationRead,
      joinConversationRoom,
      leaveConversationRoom,
      emitTypingStart,
      emitTypingStop,
    }),
    [
      state,
      totalUnreadCount,
      refreshChatsAndContacts,
      loadConversationMessages,
      sendMessage,
      startDirectConversation,
      toggleArchiveConversation,
      toggleStarMessage,
      loadStarredMessages,
      markConversationRead,
      joinConversationRoom,
      leaveConversationRoom,
      emitTypingStart,
      emitTypingStop,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
