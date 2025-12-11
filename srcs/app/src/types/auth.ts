/**
 * Authentication types
 */

import { User } from './user';

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
  };
}

export interface SessionData {
  userId: number;
  username: string;
}

// Extend Fastify's session type
declare module 'fastify' {
  interface Session {
    userId?: number;
    username?: string;
  }

  // Add user property to FastifyRequest
  interface FastifyRequest {
    user?: User;
  }
}
