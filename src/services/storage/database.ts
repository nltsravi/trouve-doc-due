import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const DB_NAME = 'trouvedocdue.db';

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      // Enable WAL mode and foreign keys for high performance and integrity
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      // Run migrations
      await runMigrations(db);

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database] Failed to initialize SQLite database:', error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
