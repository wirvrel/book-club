import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  recordView,
  getViewHistory,
  clearViewHistory,
  type ViewableType,
} from '../services/viewHistories.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const VIEWABLE_TYPES = ['book', 'author', 'collection'] as const;

const recordViewSchema = z.object({
  viewableId: z.string().uuid(),
  viewableType: z.enum(VIEWABLE_TYPES),
});

const listHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(VIEWABLE_TYPES).optional(),
});

export async function viewHistoriesHandler(fastify: FastifyInstance) {
    fastify.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['view-history'],
      description: "Get current user's view history",
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = listHistorySchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, type } = query.data;
    const { rows, total } = await getViewHistory(
      currentUser.id,
      type as ViewableType | undefined,
      page,
      limit,
    );

    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/', {
    preHandler: authenticate,
    schema: {
      tags: ['view-history'],
      description: 'Record a new item view',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = recordViewSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { viewableId, viewableType } = result.data;
    const view = await recordView(currentUser.id, viewableId, viewableType as ViewableType);

    return sendSuccess(reply, view, undefined, 201);
  });

    fastify.delete('/', {
    preHandler: authenticate,
    schema: {
      tags: ['view-history'],
      description: 'Clear the current user\'s view history',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const { type } = request.query as { type?: string };

    if (type && !VIEWABLE_TYPES.includes(type as ViewableType)) {
      return sendError(
        reply,
        400,
        'VALIDATION_ERROR',
        `type must be one of: ${VIEWABLE_TYPES.join(', ')}`,
      );
    }

    await clearViewHistory(currentUser.id, type as ViewableType | undefined);
    return sendSuccess(reply, { message: 'View history cleared' });
  });
}
