import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCommentById,
  getCommentsByItem,
  getReplies,
  getCommentsByUser,
  createComment,
  updateComment,
  deleteComment,
  type CommentableType,
} from '../services/comments.service.js';
import { addLike, removeLike, getLikeCount, isLikedByUser } from '../services/likes.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createCommentSchema = z.object({
  commentableId: z.string().uuid(),
  commentableType: z.enum(['rating', 'quote', 'collection']),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

const listCommentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function commentsHandler(fastify: FastifyInstance) {
    fastify.get('/:id', {
    schema: {
      tags: ['comments'],
      description: 'Get comment details by ID',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const comment = await getCommentById(id);
    if (!comment) return sendError(reply, 404, 'NOT_FOUND', 'Comment not found');
    return sendSuccess(reply, comment);
  });

    fastify.get('/item/:itemId', {
    schema: {
      tags: ['comments'],
      description: 'Get comments for a specific item (rating, quote, collection)',
      querystring: {
        type: 'object',
        required: ['itemType'],
        properties: {
          itemType: { type: 'string', enum: ['rating', 'quote', 'collection'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { itemId } = request.params as { itemId: string };
    const { itemType } = request.query as { itemType: CommentableType };
    const query = listCommentsSchema.safeParse(request.query);

    if (!itemType || !['rating', 'quote', 'collection'].includes(itemType)) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'itemType is required (rating, quote or collection)');
    }

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getCommentsByItem(itemId, itemType, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id/replies', {
    schema: {
      tags: ['comments'],
      description: 'Get nested replies to a specific comment',
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = listCommentsSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getReplies(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/user/:userId', {
    schema: {
      tags: ['comments'],
      description: 'Get all comments created by a specific user',
    },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const query = listCommentsSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getCommentsByUser(userId, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/', {
    preHandler: authenticate,
    schema: {
      tags: ['comments'],
      description: 'Create a new comment',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = createCommentSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const comment = await createComment(currentUser.id, result.data);
      return sendSuccess(reply, comment, undefined, 201);
    } catch (error: any) {
      if (error.code === 'PARENT_NOT_FOUND' || error.code === 'MAX_DEPTH') {
        return sendError(reply, 400, error.code, error.message);
      }
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['comments'],
      description: 'Update an existing comment',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = updateCommentSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const comment = await updateComment(id, currentUser.id, result.data.content);
      return sendSuccess(reply, comment);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['comments'],
      description: 'Delete a comment',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    try {
      await deleteComment(id, currentUser.id);
      return sendSuccess(reply, { message: 'Comment deleted successfully' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', error.message);
      }
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.post('/:id/like', {
    preHandler: authenticate,
    schema: {
      tags: ['likes'],
      description: 'Like a comment',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    const comment = await getCommentById(id);
    if (!comment) return sendError(reply, 404, 'NOT_FOUND', 'Comment not found');

    await addLike(currentUser.id, id, 'comment');
    const likeCount = await getLikeCount(id, 'comment');
    const liked = await isLikedByUser(currentUser.id, id, 'comment');
    return sendSuccess(reply, { liked, likeCount });
  });

    fastify.delete('/:id/like', {
    preHandler: authenticate,
    schema: {
      tags: ['likes'],
      description: 'Unlike a comment',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    await removeLike(currentUser.id, id, 'comment');
    const likeCount = await getLikeCount(id, 'comment');
    return sendSuccess(reply, { liked: false, likeCount });
  });
}
