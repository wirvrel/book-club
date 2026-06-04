import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { config } from './config/index.js';
import { join } from 'path';
import { authHandler } from './handlers/auth.handler.js';
import { usersHandler } from './handlers/users.handler.js';
import { booksHandler } from './handlers/books.handler.js';
import { authorsHandler } from './handlers/authors.handler.js';
import { publishersHandler } from './handlers/publishers.handler.js';
import { genresHandler } from './handlers/genres.handler.js';
import { shelvesHandler } from './handlers/shelves.handler.js';
import { ratingsHandler } from './handlers/ratings.handler.js';
import { likesHandler } from './handlers/likes.handler.js';
import { quotesHandler } from './handlers/quotes.handler.js';
import { collectionsHandler } from './handlers/collections.handler.js';
import { commentsHandler } from './handlers/comments.handler.js';
import { proposalsHandler } from './handlers/proposals.handler.js';
import { adminHandler } from './handlers/admin.handler.js';
import { favoritesHandler } from './handlers/favorites.handler.js';
import { feedHandler } from './handlers/feed.handler.js';
import { viewHistoriesHandler } from './handlers/viewHistories.handler.js';

const fastify = Fastify({
  logger: {
    level: config.server.env === 'production' ? 'info' : 'debug',
  },
});

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(jwt, {
  secret: config.jwt.secret,
});

await fastify.register(cookie, {
  secret: config.jwt.secret,
  parseOptions: {},
});

await fastify.register(staticFiles, {
  root: join(process.cwd(), 'storage'),
  prefix: '/storage',
});

await fastify.register(multipart, {
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Book Club API',
      description: 'API для вебплатформи спільноти книголюбів',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://${config.server.host}:${config.server.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management' },
      { name: 'books', description: 'Books catalog' },
      { name: 'authors', description: 'Authors management' },
      { name: 'publishers', description: 'Publishers management' },
      { name: 'genres', description: 'Genres management' },
      { name: 'shelves', description: 'User bookshelves' },
      { name: 'ratings', description: 'Book ratings' },
      { name: 'quotes', description: 'Book quotes' },
      { name: 'collections', description: 'Book collections' },
      { name: 'comments', description: 'Comments' },
      { name: 'likes', description: 'Likes' },
      { name: 'proposals', description: 'Content proposals' },
      { name: 'admin', description: 'Admin operations' },
      { name: 'favorites', description: 'Favorites' },
      { name: 'feed', description: 'Activity feed' },
      { name: 'view-histories', description: 'View history tracking' },
    ],
  },
});

await fastify.register(scalar, {
  routePrefix: '/docs',
  configuration: {
    theme: 'purple',
  },
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

await fastify.register(
  async (instance) => {
    await instance.register(authHandler, { prefix: '/auth' });
    await instance.register(usersHandler, { prefix: '/users' });
    await instance.register(booksHandler, { prefix: '/books' });
    await instance.register(authorsHandler, { prefix: '/authors' });
    await instance.register(publishersHandler, { prefix: '/publishers' });
    await instance.register(genresHandler, { prefix: '/genres' });
    await instance.register(shelvesHandler, { prefix: '/shelves' });
    await instance.register(ratingsHandler, { prefix: '/ratings' });
    await instance.register(likesHandler, { prefix: '/likes' });
    await instance.register(quotesHandler, { prefix: '/quotes' });
    await instance.register(collectionsHandler, { prefix: '/collections' });
    await instance.register(commentsHandler, { prefix: '/comments' });
    await instance.register(proposalsHandler, { prefix: '/proposals' });
    await instance.register(adminHandler, { prefix: '/admin' });
    await instance.register(favoritesHandler, { prefix: '/favorites' });
    await instance.register(feedHandler, { prefix: '/feed' });
    await instance.register(viewHistoriesHandler, { prefix: '/view-histories' });
  },
  { prefix: '/api/v1' },
);

const start = async () => {
  try {
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });
    console.log(`🚀 Server running at http://${config.server.host}:${config.server.port}`);
    console.log(`📚 API available at http://${config.server.host}:${config.server.port}/api/v1`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
