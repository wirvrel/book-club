import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  addFavorite,
  removeFavorite,
  isFavoritedByUser,
  getFavoritesByUser,
  getFavoriteCount,
  type FavoriteableType,
} from '../services/favorites.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const FAVORITEABLE_TYPES = ['book', 'collection', 'author'] as const;

const addFavoriteSchema = z.object({
  favoriteableId: z.string().uuid(),
  favoriteableType: z.enum(FAVORITEABLE_TYPES),
});

const listFavoritesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(FAVORITEABLE_TYPES).optional(),
});

export async function favoritesHandler(fastify: FastifyInstance) {
    fastify.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['favorites'],
      description: "Get current user's favorites",
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = listFavoritesSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, type } = query.data;
    const { rows, total } = await getFavoritesByUser(
      currentUser.id,
      type as FavoriteableType | undefined,
      page,
      limit,
    );
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/check', {
    preHandler: authenticate,
    schema: {
      tags: ['favorites'],
      description: 'Check if an item is in the current user\'s favorites',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { favoriteableId, favoriteableType } = request.query as {
      favoriteableId?: string;
      favoriteableType?: string;
    };

    if (!favoriteableId || !favoriteableType) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'favoriteableId and favoriteableType are required');
    }

    if (!FAVORITEABLE_TYPES.includes(favoriteableType as FavoriteableType)) {
      return sendError(reply, 400, 'VALIDATION_ERROR', `favoriteableType must be one of: ${FAVORITEABLE_TYPES.join(', ')}`);
    }

    const favorited = await isFavoritedByUser(
      currentUser.id,
      favoriteableId,
      favoriteableType as FavoriteableType,
    );
    const favoriteCount = await getFavoriteCount(favoriteableId, favoriteableType as FavoriteableType);

    return sendSuccess(reply, { favorited, favoriteCount });
  });

    fastify.post('/', {
    preHandler: authenticate,
    schema: {
      tags: ['favorites'],
      description: 'Add an item to favorites',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = addFavoriteSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { favoriteableId, favoriteableType } = result.data;
    const favorite = await addFavorite(currentUser.id, favoriteableId, favoriteableType);
    const favoriteCount = await getFavoriteCount(favoriteableId, favoriteableType);

    return sendSuccess(reply, { favorite, favorited: true, favoriteCount }, undefined, 201);
  });

    fastify.delete('/', {
    preHandler: authenticate,
    schema: {
      tags: ['favorites'],
      description: 'Remove an item from favorites',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = addFavoriteSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { favoriteableId, favoriteableType } = result.data;
    const removed = await removeFavorite(currentUser.id, favoriteableId, favoriteableType);

    if (!removed) {
      return sendError(reply, 404, 'NOT_FOUND', 'Favorite not found');
    }

    const favoriteCount = await getFavoriteCount(favoriteableId, favoriteableType);
    return sendSuccess(reply, { favorited: false, favoriteCount });
  });
}
