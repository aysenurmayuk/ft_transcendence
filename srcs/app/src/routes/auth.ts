import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { createUser, getUserByUsername, getUserById, usernameExists } from '../db/sqlite';
import { hashPassword, comparePassword } from '../utils/hash';
import { registerSchema, loginSchema } from '../utils/validation';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';
import { requireAuth } from '../middleware/auth';

/**
 * Authentication routes plugin
 */
export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post<{ Body: RegisterRequest }>(
    '/register',
    async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const { username, password } = registerSchema.parse(request.body);

        // Check if username already exists
        if (usernameExists(username)) {
          return reply.code(409).send({
            error: 'Username already taken',
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = createUser({
          username,
          passwordHash,
        });

        // Create session
        request.session.userId = user.id;
        request.session.username = user.username;

        // Return user data (without password hash)
        const response: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
          },
        };

        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.code(400).send({
            error: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }

        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/auth/login
   * Login with username and password
   */
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const { username, password } = loginSchema.parse(request.body);

        // Find user by username
        const user = getUserByUsername(username);

        // Check if user exists and password is correct
        if (!user || !(await comparePassword(password, user.password_hash))) {
          return reply.code(401).send({
            error: 'Invalid credentials',
          });
        }

        // Create session
        request.session.userId = user.id;
        request.session.username = user.username;

        // Return user data
        const response: AuthResponse = {
          user: {
            id: user.id,
            username: user.username,
          },
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.code(400).send({
            error: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }

        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Destroy session
      await new Promise<void>((resolve) => request.session.destroy(() => resolve()));
      
      return reply.code(200).send({
        message: 'Logged out successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  fastify.get('/me', {
    preHandler: requireAuth,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // User is guaranteed to exist because of requireAuth middleware
      // requireAuth also fetches fresh data from DB
      const user = getUserById(request.session.userId!);

      if (!user) {
        // Session is stale, destroy it
        await new Promise<void>((resolve) => request.session.destroy(() => resolve()));
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Session expired',
        });
      }

      // Return fresh user data
      const response: AuthResponse = {
        user: {
          id: user.id,
          username: user.username,
        },
      };

      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Internal server error',
      });
    }
  });
}
