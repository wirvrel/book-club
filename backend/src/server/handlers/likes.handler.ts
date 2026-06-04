import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  addLike,
  removeLike,
  getLikeCount,
  getLikesByUser,
  isLikedByUser,
  getLikedItems,
  type LikeableType,
} from '../services/likes.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const LIKEABLE_TYPES = ['rating', 'quote', 'comment', 'collection'] as const;

const likeSchema = z.object({
  likeableId: z.string().uuid(),
  likeableType: z.enum(LIKEABLE_TYPES),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  likeableType: z.enum(LIKEABLE_TYPES).optional(),
});

const checkLikeSchema = z.object({
  likeableId: z.string().uuid(),
  likeableType: z.enum(LIKEABLE_TYPES),
});

export async function likesHandler(fastify: FastifyInstance) {
    fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = likeSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { likeableId, likeableType } = result.data;
    const like = await addLike(currentUser.id, likeableId, likeableType);
    const count = await getLikeCount(likeableId, likeableType);
    return sendSuccess(reply, { like, likeCount: count });
  });

    fastify.delete('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = likeSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { likeableId, likeableType } = result.data;
    await removeLike(currentUser.id, likeableId, likeableType);
    const count = await getLikeCount(likeableId, likeableType);
    return sendSuccess(reply, { liked: false, likeCount: count });
  });

    fastify.get('/count', async (request, reply) => {
    const result = checkLikeSchema.safeParse(request.query);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', result.error.flatten());
    }

    const { likeableId, likeableType } = result.data;
    const count = await getLikeCount(likeableId, likeableType);
    return sendSuccess(reply, { likeableId, likeableType, count });
  });

    fastify.get('/check', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = checkLikeSchema.safeParse(request.query);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', result.error.flatten());
    }

    const { likeableId, likeableType } = result.data;
    const liked = await isLikedByUser(currentUser.id, likeableId, likeableType);
    return sendSuccess(reply, { liked, likeableId, likeableType });
  });

    fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = paginationSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, likeableType } = query.data;
    const { rows, total } = await getLikesByUser(currentUser.id, page, limit, likeableType);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/me/:type', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { type } = request.params as { type: string };

    if (!LIKEABLE_TYPES.includes(type as LikeableType)) {
      return sendError(reply, 400, 'VALIDATION_ERROR', `Invalid type. Allowed: ${LIKEABLE_TYPES.join(', ')}`);
    }

    const likedIds = await getLikedItems(currentUser.id, type as LikeableType);
    return sendSuccess(reply, likedIds);
  });
}
