import Database from 'better-sqlite3';
import { UserRow, CreateUserParams } from '../types/user';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_DB_PATH = '/data/database.db';

/**
 * Parse DATABASE_URL environment variable
 * Format: sqlite:///path/to/database.db
 */
function parseDatabaseUrl(url?: string): string {
  if (!url) {
    return DEFAULT_DB_PATH;
  }

  // Remove sqlite:// or sqlite:/// prefix
  const withoutProtocol = url.replace(/^sqlite:\/\/\/?/, '');
  
  return withoutProtocol || DEFAULT_DB_PATH;
}

/**
 * Ensure database directory exists
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[DB] Created directory: ${dir}`);
  }
}

let dbInstance: Database.Database | null = null;

/**
 * Get or create database connection
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = parseDatabaseUrl(process.env.DATABASE_URL);
    console.log(`[DB] Opening database at: ${dbPath}`);
    
    // Ensure directory exists before creating database
    ensureDirectoryExists(dbPath);
    
    dbInstance = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });
    
    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    dbInstance.pragma('journal_mode = WAL');
  }
  
  return dbInstance;
}

/**
 * Initialize database schema
 */
export function initDatabase(): void {
  const db = getDatabase();
  
  console.log('[DB] Initializing database schema...');
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create index on username for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username 
    ON users(username);
  `);
  
  console.log('[DB] Database schema initialized successfully');
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DB] Database connection closed');
  }
}

// ============================================================================
// User Queries
// ============================================================================

/**
 * Create a new user
 */
export function createUser(params: CreateUserParams): UserRow {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash)
    VALUES (?, ?)
  `);
  
  const result = stmt.run(params.username, params.passwordHash);
  
  // Fetch the created user
  const user = getUserById(Number(result.lastInsertRowid));
  if (!user) {
    throw new Error('Failed to create user');
  }
  
  return user;
}

/**
 * Get user by ID
 */
export function getUserById(id: number): UserRow | undefined {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, username, password_hash, created_at
    FROM users
    WHERE id = ?
  `);
  
  return stmt.get(id) as UserRow | undefined;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, username, password_hash, created_at
    FROM users
    WHERE username = ?
  `);
  
  return stmt.get(username) as UserRow | undefined;
}

/**
 * Get all users
 */
export function getAllUsers(): UserRow[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT id, username, password_hash, created_at
    FROM users
    ORDER BY created_at DESC
  `);
  
  return stmt.all() as UserRow[];
}

/**
 * Check if username exists
 */
export function usernameExists(username: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 1 FROM users WHERE username = ? LIMIT 1
  `);
  
  return stmt.get(username) !== undefined;
}

/**
 * Delete user by ID
 */
export function deleteUser(id: number): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    DELETE FROM users WHERE id = ?
  `);
  
  const result = stmt.run(id);
  return result.changes > 0;
}