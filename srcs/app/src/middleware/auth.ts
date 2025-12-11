import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserById } from '../db/sqlite';
import { User } from '../types/user';

/**
 * Authentication middleware
 * Verifies that the user is authenticated via session
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check if session has userId
  if (!request.session.userId) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
    return;
  }

  // Fetch user from database
  const userRow = getUserById(request.session.userId);

  if (!userRow) {
    // Session has invalid user ID - destroy session
    await new Promise<void>((resolve) => request.session.destroy(() => resolve()));
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid session',
    });
    return;
  }

  // Attach user to request for use in route handlers
  request.user = {
    id: userRow.id,
    username: userRow.username,
    createdAt: new Date(userRow.created_at),
  };
}

/**
 * Optional authentication middleware
 * Attaches user to request if authenticated, but doesn't reject if not
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Check if session has userId
  if (!request.session.userId) {
    return;
  }

  // Fetch user from database
  const userRow = getUserById(request.session.userId);

  if (userRow) {
    // Attach user to request
    request.user = {
      id: userRow.id,
      username: userRow.username,
      createdAt: new Date(userRow.created_at),
    };
  }
}
