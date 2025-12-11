import { SessionStore } from '@fastify/session';
import { getDatabase } from '../db/sqlite';

/**
 * SQLite-based session store for @fastify/session
 * Implements the SessionStore interface
 */
export class SqliteSessionStore implements SessionStore {
  private db;

  constructor() {
    this.db = getDatabase();
    this.createSessionTable();
  }

  /**
   * Create sessions table if not exists
   */
  private createSessionTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER,
        expires_at INTEGER NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster cleanup of expired sessions
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires 
      ON sessions(expires_at);
    `);

    console.log('[SessionStore] Session table initialized');
  }

  /**
   * Set (create or update) a session
   */
  set(
    sessionId: string,
    session: any,
    callback: (err?: any) => void
  ): void {
    try {
      const now = Date.now();
      const expiresAt = session.cookie?.expires
        ? new Date(session.cookie.expires).getTime()
        : now + 1000 * 60 * 60 * 24 * 7; // Default 7 days

      const data = JSON.stringify(session);
      const userId = session.userId || null;

      const stmt = this.db.prepare(`
        INSERT INTO sessions (session_id, user_id, expires_at, data)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          user_id = excluded.user_id,
          expires_at = excluded.expires_at,
          data = excluded.data
      `);

      stmt.run(sessionId, userId, expiresAt, data);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Get a session by ID
   */
  get(
    sessionId: string,
    callback: (err: any, result?: any) => void
  ): void {
    try {
      const now = Date.now();
      
      const stmt = this.db.prepare(`
        SELECT data, expires_at FROM sessions 
        WHERE session_id = ? AND expires_at > ?
      `);

      const row = stmt.get(sessionId, now) as { data: string; expires_at: number } | undefined;

      if (!row) {
        callback(null, null);
        return;
      }

      const session = JSON.parse(row.data);
      callback(null, session);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Destroy (delete) a session
   */
  destroy(
    sessionId: string,
    callback: (err?: any) => void
  ): void {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM sessions WHERE session_id = ?
      `);

      stmt.run(sessionId);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Clean up expired sessions
   * This should be called periodically
   */
  cleanupExpired(): number {
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE expires_at <= ?
    `);

    const result = stmt.run(now);
    return result.changes;
  }
}

/**
 * Start periodic cleanup of expired sessions
 */
export function startSessionCleanup(store: SqliteSessionStore, intervalMs = 1000 * 60 * 15): NodeJS.Timeout {
  console.log('[SessionStore] Starting periodic cleanup (every 15 minutes)');
  
  return setInterval(() => {
    const deleted = store.cleanupExpired();
    if (deleted > 0) {
      console.log(`[SessionStore] Cleaned up ${deleted} expired sessions`);
    }
  }, intervalMs);
}
