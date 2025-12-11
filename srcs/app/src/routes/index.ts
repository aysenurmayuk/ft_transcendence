import { FastifyInstance } from 'fastify';

/**
 * Root API routes
 * This file is a placeholder for future API routes
 */
export default async function rootRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Welcome to the Pong Game API!',
      version: '1.0.0',
    });
  });
}