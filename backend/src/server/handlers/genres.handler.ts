import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  listGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
  getGenreBooks,
  getGenreHierarchy,
} from '../services/genres.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const listGenresSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  search: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'bookCount', 'created']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createGenreSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

const updateGenreSchema = createGenreSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export async function genresHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    schema: {
      tags: ['genres'],
      description: 'Get list of genres',
    },
  }, async (request, reply) => {
    const query = listGenresSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listGenres(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/hierarchy', {
    schema: {
      tags: ['genres'],
      description: 'Get genre hierarchy tree',
    },
  }, async (request, reply) => {
    const hierarchy = await getGenreHierarchy();
    return sendSuccess(reply, hierarchy);
  });

    fastify.get('/:id', {
    schema: {
      tags: ['genres'],
      description: 'Get genre details by ID',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const genre = await getGenreById(id);
    if (!genre) return sendError(reply, 404, 'NOT_FOUND', 'Genre not found');
    return sendSuccess(reply, genre);
  });

    fastify.post('/', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['genres'],
      description: 'Create a new genre (Admin only)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const result = createGenreSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const genre = await createGenre(result.data);
      return sendSuccess(reply, genre, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['genres'],
      description: 'Update genre details (Admin only)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateGenreSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const genre = await updateGenre(id, result.data);
      if (!genre) return sendError(reply, 404, 'NOT_FOUND', 'Genre not found');
      return sendSuccess(reply, genre);
    } catch (error: any) {
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['genres'],
      description: 'Delete a genre (Admin only)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deleteGenre(id);
      return sendSuccess(reply, { message: 'Genre deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.get('/:id/books', {
    schema: {
      tags: ['genres'],
      description: 'Get books in a specific genre',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getGenreBooks(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });
}
