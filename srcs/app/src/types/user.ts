/**
 * User domain types
 */

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string; // ISO datetime string from SQLite
}

export interface User {
  id: number;
  username: string;
  createdAt: Date;
}

export interface CreateUserParams {
  username: string;
  passwordHash: string;
}
