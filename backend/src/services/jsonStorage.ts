import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface BaseEntity {
  id: string;
}

/**
 * Reusable asynchronous JSON file storage service.
 * Uses a per-file Promise queue to serialize concurrent reads/writes safely
 * and writes via an atomic temporary file before renaming to prevent corrupted JSON.
 */
export class JsonStorageService<T extends BaseEntity> {
  private readonly filePath: string;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(fileName: string) {
    const dataDir = path.resolve(__dirname, '../../data');
    this.filePath = path.join(dataDir, fileName);
  }

  /**
   * Enqueues an exclusive operation so concurrent mutations never interleave or corrupt the file.
   */
  private enqueue<R>(operation: () => Promise<R>): Promise<R> {
    const next = this.writeQueue.then(operation, operation);
    this.writeQueue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  /**
   * Ensures the parent directory and target JSON file exist and contain a valid JSON array.
   */
  private async ensureFileExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]\n', 'utf-8');
    }
  }

  /**
   * Internal unlocked read (called inside queued operations or read methods).
   */
  private async readRaw(): Promise<T[]> {
    await this.ensureFileExists();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    const trimmed = raw.trim();
    if (!trimmed) {
      await this.writeRaw([]);
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        throw new Error(`Expected JSON array in ${this.filePath}`);
      }
      return parsed as T[];
    } catch (error) {
      throw new Error(
        `Invalid JSON detected in ${path.basename(this.filePath)}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Internal unlocked write that serializes and validates JSON before atomically replacing the file.
   */
  private async writeRaw(records: T[]): Promise<void> {
    await this.ensureFileExists();
    const serialized = JSON.stringify(records, null, 2) + '\n';
    // Validate JSON string before touching disk
    JSON.parse(serialized);
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, serialized, 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }

  public async findAll(): Promise<T[]> {
    return this.enqueue(() => this.readRaw());
  }

  public async findById(id: string): Promise<T | null> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      return records.find((item) => item.id === id) ?? null;
    });
  }

  public async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      return records.find(predicate) ?? null;
    });
  }

  public async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      return records.filter(predicate);
    });
  }

  public async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      const newRecord = {
        ...data,
        id: data.id ?? uuidv4(),
      } as T;
      records.push(newRecord);
      await this.writeRaw(records);
      return newRecord;
    });
  }

  public async updateById(
    id: string,
    updates: Partial<Omit<T, 'id'>> | ((current: T) => T)
  ): Promise<T | null> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      const index = records.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      const current = records[index];
      const updated: T =
        typeof updates === 'function'
          ? { ...updates(current), id: current.id }
          : { ...current, ...updates, id: current.id };
      records[index] = updated;
      await this.writeRaw(records);
      return updated;
    });
  }

  public async deleteById(id: string): Promise<boolean> {
    return this.enqueue(async () => {
      const records = await this.readRaw();
      const filtered = records.filter((item) => item.id !== id);
      if (filtered.length === records.length) {
        return false;
      }
      await this.writeRaw(filtered);
      return true;
    });
  }
}
