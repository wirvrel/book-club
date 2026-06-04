import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { getFeed, type FeedItemType } from '../services/feed.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const feedSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['rating', 'quote', 'collection']).optional(),
});

export async function feedHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    preHandler: authenticate,
    schema: {
      tags: ['feed'],
      description: 'Get activity feed from followed users',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = feedSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, type } = query.data;
    const { items, total } = await getFeed(
      currentUser.id,
      page,
      limit,
      type as FeedItemType | undefined,
    );

    return sendSuccess(reply, items, buildPaginationMeta(total, page, limit));
  });
}
