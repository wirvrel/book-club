import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  getQuoteById,
  getQuotesByBook,
  getQuotesByUser,
  listQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
} from '../services/quotes.service.js';
import { addLike, removeLike, getLikeCount, isLikedByUser } from '../services/likes.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createQuoteSchema = z.object({
  bookId: z.string().uuid(),
  text: z.string().min(1).max(1000),
  pageNumber: z.number().int().positive().optional(),
  containsSpoilers: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const updateQuoteSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  pageNumber: z.number().int().positive().optional(),
  containsSpoilers: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const listQuotesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  bookId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  includeSpoilers: z.coerce.boolean().optional(),
  isPublic: z.coerce.boolean().optional(),
  sortBy: z.enum(['created']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function quotesHandler(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
    const query = listQuotesSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listQuotes(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const quote = await getQuoteById(id);
    if (!quote) return sendError(reply, 404, 'NOT_FOUND', 'Quote not found');
    return sendSuccess(reply, quote);
  });

    fastify.get('/book/:bookId', async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const query = listQuotesSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, includeSpoilers } = query.data;
    const { rows, total } = await getQuotesByBook(bookId, page, limit, includeSpoilers);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const query = listQuotesSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getQuotesByUser(userId, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = createQuoteSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const quote = await createQuote(currentUser.id, result.data);
    return sendSuccess(reply, quote, undefined, 201);
  });

    fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = updateQuoteSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const quote = await updateQuote(id, currentUser.id, result.data);
      return sendSuccess(reply, quote);
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
      await deleteQuote(id, currentUser.id);
      return sendSuccess(reply, { message: 'Quote deleted successfully' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.post('/:id/like', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    const quote = await getQuoteById(id);
    if (!quote) return sendError(reply, 404, 'NOT_FOUND', 'Quote not found');

    await addLike(currentUser.id, id, 'quote');
    const likeCount = await getLikeCount(id, 'quote');
    const liked = await isLikedByUser(currentUser.id, id, 'quote');
    return sendSuccess(reply, { liked, likeCount });
  });

    fastify.delete('/:id/like', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    await removeLike(currentUser.id, id, 'quote');
    const likeCount = await getLikeCount(id, 'quote');
    return sendSuccess(reply, { liked: false, likeCount });
  });
}
