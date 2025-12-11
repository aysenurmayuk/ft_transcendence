import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyWebsocket from '@fastify/websocket';
import path from 'path';
import { initDatabase, closeDatabase } from './db/sqlite';
import { SqliteSessionStore, startSessionCleanup } from './utils/session-store';
import authRoutes from './routes/auth';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  trustProxy: true, // Running behind nginx
});

// Initialize database
initDatabase();

// Create session store and start cleanup
const sessionStore = new SqliteSessionStore();
let cleanupInterval: NodeJS.Timeout;

/**
 * Register plugins
 */
async function registerPlugins() {
  // CORS support
  await fastify.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  // Cookie support (required for session)
  await fastify.register(fastifyCookie);

  // Session support with SQLite store
  await fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'supersecretkeythatshouldbeinenvfile',
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    },
    saveUninitialized: false,
  });

  // Start session cleanup
  cleanupInterval = startSessionCleanup(sessionStore);

  // WebSocket support
  await fastify.register(fastifyWebsocket);

  // Static file serving for SPA
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/', // Serve files from /public at root
    decorateReply: false, // Don't add sendFile to reply - we'll handle it manually
  });

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // SPA fallback - serve index.html for all non-API, non-static routes
  // Fastify will try static files first, then this fallback
  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'Route not found' });
    } else {
      // Serve index.html for SPA routing
      return reply.sendFile('index.html');
    }
  });
}

/**
 * Start server
 */
async function start() {
  try {
    await registerPlugins();

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0'; // Listen on all interfaces (Docker requirement)

    await fastify.listen({ port, host });

    console.log(`🚀 Server is running on http://${host}:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, closing server gracefully...`);
  
  try {
    // Clear session cleanup interval
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    
    await fastify.close();
    closeDatabase();
    console.log('Server closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
start();