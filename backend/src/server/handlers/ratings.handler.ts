import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  getRatingById,
  getRatingsByBook,
  getRatingsByUser,
  getUserRatingForBook,
  listRatings,
  createRating,
  updateRating,
  deleteRating,
} from '../services/ratings.service.js';
import { addLike, removeLike, getLikeCount, isLikedByUser } from '../services/likes.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createRatingSchema = z.object({
  bookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(5000).optional(),
});

const updateRatingSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(5000).optional(),
});

const listRatingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  bookId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  hasReview: z.coerce.boolean().optional(),
  fromFollowed: z.coerce.boolean().optional(),
    sortBy: z.enum(['created', 'rating', 'likes']).default('created'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function ratingsHandler(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
    const query = listRatingsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

        let currentUserId: string | undefined;
    try {
      await request.jwtVerify();
      currentUserId = (request.user as { id: string }).id;
    } catch {
    }

    const { rows, total } = await listRatings({
      ...query.data,
      currentUserId,
    });
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const rating = await getRatingById(id);
    if (!rating) return sendError(reply, 404, 'NOT_FOUND', 'Rating not found');
    return sendSuccess(reply, rating);
  });

    fastify.get('/book/:bookId', async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const query = listRatingsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getRatingsByBook(bookId, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/user/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const query = listRatingsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getRatingsByUser(userId, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/me/book/:bookId', { preHandler: authenticate }, async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const currentUser = request.user as { id: string };

    const rating = await getUserRatingForBook(currentUser.id, bookId);
    return sendSuccess(reply, rating);
  });

    fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = createRatingSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const rating = await createRating(currentUser.id, result.data);
      return sendSuccess(reply, rating, undefined, 201);
    } catch (error: any) {
      if (error.code === 'ALREADY_RATED') {
        return sendError(reply, 400, 'ALREADY_RATED', error.message);
      }
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = updateRatingSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const rating = await updateRating(id, currentUser.id, result.data);
      return sendSuccess(reply, rating);
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
      await deleteRating(id, currentUser.id);
      return sendSuccess(reply, { message: 'Rating deleted successfully' });
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

    const rating = await getRatingById(id);
    if (!rating) return sendError(reply, 404, 'NOT_FOUND', 'Rating not found');

    await addLike(currentUser.id, id, 'rating');
    const likeCount = await getLikeCount(id, 'rating');
    const liked = await isLikedByUser(currentUser.id, id, 'rating');
    return sendSuccess(reply, { liked, likeCount });
  });

    fastify.delete('/:id/like', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    await removeLike(currentUser.id, id, 'rating');
    const likeCount = await getLikeCount(id, 'rating');
    return sendSuccess(reply, { liked: false, likeCount });
  });
}
