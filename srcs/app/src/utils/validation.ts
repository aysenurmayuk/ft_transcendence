import { z } from 'zod';

/**
 * Username validation rules:
 * - 3-20 characters
 * - Only alphanumeric and underscore
 */
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one letter and one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Register request schema
 */
export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * Login request schema
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
