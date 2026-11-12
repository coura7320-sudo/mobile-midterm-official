import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Conversation, Message, MessageStatus, User } from '../types';

const DB_NAME = 'whatsapp_clone_v1.db';

export interface PendingOutboxItem {
  tempId: string;
  conversationId: string;
  text: string;
  createdAt: string;
}

class SqliteStorageService {
  private dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

  private async getDb(): Promise<SQLite.SQLiteDatabase | null> {
    if (Platform.OS === 'web') {
      return null;
    }
    if (!this.dbPromise) {
      this.dbPromise = this.initialize();
    }
    return this.dbPromise;
  }

  private async initialize(): Promise<SQLite.SQLiteDatabase | null> {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY NOT NULL,
          fullName TEXT NOT NULL,
          email TEXT NOT NULL,
          avatarUrl TEXT,
          about TEXT,
          isOnline INTEGER DEFAULT 0,
          lastSeen TEXT,
          createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          participantIdsJson TEXT NOT NULL,
          participantsJson TEXT,
          name TEXT,
          avatarUrl TEXT,
          lastMessageId TEXT,
          lastMessageText TEXT,
          lastMessageAt TEXT,
          unreadCount INTEGER DEFAULT 0,
          archivedByJson TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          conversationId TEXT NOT NULL,
          senderId TEXT NOT NULL,
          text TEXT NOT NULL,
          status TEXT NOT NULL,
          deliveredToJson TEXT NOT NULL,
          readByJson TEXT NOT NULL,
          starredByJson TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_messages_conversation
          ON messages (conversationId, createdAt);

        CREATE TABLE IF NOT EXISTS pending_outbox (
          tempId TEXT PRIMARY KEY NOT NULL,
          conversationId TEXT NOT NULL,
          text TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      return db;
    } catch (err) {
      console.warn('[SQLite] Initialization warning:', err);
      return null;
    }
  }

  public async initDatabase(): Promise<void> {
    await this.getDb();
  }

  // ---------------- CONTACTS ----------------

  public async saveContacts(contacts: User[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      for (const c of contacts) {
        await db.runAsync(
          `INSERT OR REPLACE INTO contacts
            (id, fullName, email, avatarUrl, about, isOnline, lastSeen, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          c.id,
          c.fullName,
          c.email,
          c.avatarUrl || '',
          c.about || '',
          c.isOnline ? 1 : 0,
          c.lastSeen || '',
          c.createdAt || ''
        );
      }
    } catch (err) {
      console.warn('[SQLite] saveContacts error:', err);
    }
  }

  public async getContacts(): Promise<User[]> {
    const db = await this.getDb();
    if (!db) return [];

    try {
      const rows = await db.getAllAsync<{
        id: string;
        fullName: string;
        email: string;
        avatarUrl: string;
        about: string;
        isOnline: number;
        lastSeen: string;
        createdAt: string;
      }>('SELECT * FROM contacts ORDER BY fullName ASC');

      return rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        avatarUrl: r.avatarUrl,
        about: r.about,
        isOnline: Boolean(r.isOnline),
        lastSeen: r.lastSeen,
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  }

  // ---------------- CONVERSATIONS ----------------

  public async saveConversations(conversations: Conversation[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      for (const conv of conversations) {
        await this.upsertConversation(conv);
      }
    } catch (err) {
      console.warn('[SQLite] saveConversations error:', err);
    }
  }

  public async upsertConversation(conv: Conversation): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO conversations
          (id, type, participantIdsJson, participantsJson, name, avatarUrl,
           lastMessageId, lastMessageText, lastMessageAt, unreadCount,
           archivedByJson, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        conv.id,
        conv.type,
        JSON.stringify(conv.participantIds || []),
        JSON.stringify(conv.participants || []),
        conv.name || null,
        conv.avatarUrl || null,
        conv.lastMessageId || null,
        conv.lastMessageText || null,
        conv.lastMessageAt || null,
        conv.unreadCount ?? 0,
        JSON.stringify(conv.archivedBy || []),
        conv.createdAt,
        conv.updatedAt
      );
    } catch (err) {
      console.warn('[SQLite] upsertConversation error:', err);
    }
  }

  public async getConversations(): Promise<Conversation[]> {
    const db = await this.getDb();
    if (!db) return [];

    try {
      const rows = await db.getAllAsync<{
        id: string;
        type: 'direct' | 'group';
        participantIdsJson: string;
        participantsJson: string | null;
        name: string | null;
        avatarUrl: string | null;
        lastMessageId: string | null;
        lastMessageText: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
        archivedByJson: string | null;
        createdAt: string;
        updatedAt: string;
      }>('SELECT * FROM conversations ORDER BY COALESCE(lastMessageAt, updatedAt) DESC');

      return rows.map((r) => ({
        id: r.id,
        type: r.type,
        participantIds: JSON.parse(r.participantIdsJson || '[]'),
        participants: r.participantsJson ? JSON.parse(r.participantsJson) : [],
        name: r.name || undefined,
        avatarUrl: r.avatarUrl || undefined,
        lastMessageId: r.lastMessageId || undefined,
        lastMessageText: r.lastMessageText || undefined,
        lastMessageAt: r.lastMessageAt || undefined,
        unreadCount: r.unreadCount || 0,
        archivedBy: r.archivedByJson ? JSON.parse(r.archivedByJson) : [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch {
      return [];
    }
  }

  // ---------------- MESSAGES ----------------

  public async saveMessages(messages: Message[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      for (const msg of messages) {
        await this.upsertMessage(msg);
      }
    } catch (err) {
      console.warn('[SQLite] saveMessages error:', err);
    }
  }

  public async upsertMessage(msg: Message): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO messages
          (id, conversationId, senderId, text, status, deliveredToJson, readByJson, starredByJson, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        msg.id,
        msg.conversationId,
        msg.senderId,
        msg.text,
        msg.status,
        JSON.stringify(msg.deliveredTo || []),
        JSON.stringify(msg.readBy || []),
        JSON.stringify(msg.starredBy || []),
        msg.createdAt
      );

      await db.runAsync(
        `UPDATE conversations
         SET lastMessageId = ?, lastMessageText = ?, lastMessageAt = ?, updatedAt = ?
         WHERE id = ?`,
        msg.id,
        msg.text,
        msg.createdAt,
        msg.createdAt,
        msg.conversationId
      );
    } catch (err) {
      console.warn('[SQLite] upsertMessage error:', err);
    }
  }

  public async updateMessageStatus(
    messageId: string,
    status: MessageStatus
  ): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      await db.runAsync(
        'UPDATE messages SET status = ? WHERE id = ?',
        status,
        messageId
      );
    } catch (err) {
      console.warn('[SQLite] updateMessageStatus error:', err);
    }
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    const db = await this.getDb();
    if (!db) return [];

    try {
      const rows = await db.getAllAsync<{
        id: string;
        conversationId: string;
        senderId: string;
        text: string;
        status: MessageStatus;
        deliveredToJson: string;
        readByJson: string;
        starredByJson: string;
        createdAt: string;
      }>(
        'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC',
        conversationId
      );

      return rows.map((r) => ({
        id: r.id,
        conversationId: r.conversationId,
        senderId: r.senderId,
        text: r.text,
        status: r.status,
        deliveredTo: JSON.parse(r.deliveredToJson || '[]'),
        readBy: JSON.parse(r.readByJson || '[]'),
        starredBy: JSON.parse(r.starredByJson || '[]'),
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  }

  // ---------------- OFFLINE OUTBOX QUEUE ----------------

  public async enqueuePendingMessage(item: PendingOutboxItem): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO pending_outbox (tempId, conversationId, text, createdAt)
         VALUES (?, ?, ?, ?)`,
        item.tempId,
        item.conversationId,
        item.text,
        item.createdAt
      );
    } catch (err) {
      console.warn('[SQLite] enqueuePendingMessage error:', err);
    }
  }

  public async getPendingOutbox(): Promise<PendingOutboxItem[]> {
    const db = await this.getDb();
    if (!db) return [];

    try {
      return await db.getAllAsync<PendingOutboxItem>(
        'SELECT * FROM pending_outbox ORDER BY createdAt ASC'
      );
    } catch {
      return [];
    }
  }

  public async removePendingMessage(tempId: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM pending_outbox WHERE tempId = ?', tempId);
    } catch (err) {
      console.warn('[SQLite] removePendingMessage error:', err);
    }
  }
}

export const sqliteService = new SqliteStorageService();
