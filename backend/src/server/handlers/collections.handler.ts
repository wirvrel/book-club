import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import {
  getCollectionById,
  getCollectionWithBooks,
  getCollectionsByUser,
  listPublicCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addBookToCollection,
  removeBookFromCollection,
  reorderBooksInCollection,
} from '../services/collections.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createCollectionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const updateCollectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  coverImage: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const addBookSchema = z.object({
  bookId: z.string().uuid(),
});

const reorderSchema = z.object({
  bookIds: z.array(z.string().uuid()),
});

const listCollectionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created', 'title']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function collectionsHandler(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
    const query = listCollectionsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listPublicCollections(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/:id', { preHandler: optionalAuthenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const viewerId = (request.user as { id?: string })?.id;

    const collection = await getCollectionWithBooks(id, false, viewerId);
    if (!collection) return sendError(reply, 404, 'NOT_FOUND', 'Collection not found');

    return sendSuccess(reply, collection);
  });

    fastify.get('/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const query = listCollectionsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getCollectionsByUser(userId, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = listCollectionsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getCollectionsByUser(currentUser.id, page, limit, true);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = createCollectionSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const collection = await createCollection(currentUser.id, result.data);
    return sendSuccess(reply, collection, undefined, 201);
  });

    fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = updateCollectionSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const collection = await updateCollection(id, currentUser.id, result.data);
      return sendSuccess(reply, collection);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    try {
      await deleteCollection(id, currentUser.id);
      return sendSuccess(reply, { message: 'Collection deleted successfully' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.post('/:id/books', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = addBookSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const collectionBook = await addBookToCollection(currentUser.id, id, result.data.bookId);
      return sendSuccess(reply, collectionBook, undefined, 201);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });

    fastify.delete('/:id/books/:bookId', { preHandler: authenticate }, async (request, reply) => {
    const { id, bookId } = request.params as { id: string; bookId: string };
    const currentUser = request.user as { id: string };

    try {
      await removeBookFromCollection(currentUser.id, id, bookId);
      return sendSuccess(reply, { message: 'Book removed from collection' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });

    fastify.post('/:id/reorder', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = reorderSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      await reorderBooksInCollection(currentUser.id, id, result.data.bookIds);
      return sendSuccess(reply, { message: 'Collection reordered' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });
}