import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  listUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserShelves,
  getUserRatings,
  getUserQuotes,
  getUserCollections,
} from '../services/users.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';
import { saveUploadedFile } from '../utils/upload.js';
import { commonSchemas } from '../utils/schemas.js';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(500).optional(),
  birthday: z.string().optional(),
  gender: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  socialMediaLinks: z.record(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

function isOwnerOrAdmin(request: any, targetId: string): boolean {
  const current = request.user as { id: string; role?: string } | undefined;
  if (!current) return false;
  return current.id === targetId || current.role === 'admin';
}

export async function usersHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    schema: {
      tags: ['users'],
      description: 'Get list of users',
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.userObject,
        }),
      },
    },
  }, async (request, reply) => {
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }
    const { page, limit, search } = query.data;
    const { rows, total } = await listUsers({ page, limit, search });
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id', {
    schema: {
      tags: ['users'],
      description: 'Get user by ID',
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse(commonSchemas.userObject),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

        let currentUserId: string | undefined;
    try { 
      const decoded = await request.jwtVerify() as { id: string }; 
      currentUserId = decoded.id;
    } catch {
    }

    const user = await getUserById(id, currentUserId);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    if (!user.isPublic && !isOwnerOrAdmin(request, id)) {
      return sendError(reply, 403, 'FORBIDDEN', 'This profile is private');
    }

    const { passwordHash, ...safeUser } = user;
        const responseUser = isOwnerOrAdmin(request, id)
      ? safeUser
      : (({ role: _role, ...rest }) => rest)(safeUser);

    return sendSuccess(reply, responseUser);
  });

    fastify.patch('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Update user profile',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      body: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          bio: { type: 'string', maxLength: 500 },
          birthday: { type: 'string' },
          gender: { type: 'string', maxLength: 20 },
          location: { type: 'string', maxLength: 100 },
          socialMediaLinks: { type: 'object' },
          isPublic: { type: 'boolean' },
        },
      },
      response: {
        200: commonSchemas.successResponse(commonSchemas.userObject),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string; role: string };

    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return sendError(reply, 403, 'FORBIDDEN', 'Cannot edit another user\'s profile');
    }

    const result = updateProfileSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const updated = await updateUser(id, result.data);
    if (!updated) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    const { passwordHash, ...safeUser } = updated;
    return sendSuccess(reply, safeUser);
  });

    fastify.post('/:id/avatar', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Upload user avatar',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      consumes: ['multipart/form-data'],
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            profilePicture: { type: 'string' },
          },
        }),
        400: commonSchemas.errorResponse,
        403: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string; role: string };

    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return sendError(reply, 403, 'FORBIDDEN', 'Cannot edit another user\'s profile');
    }

    const file = await request.file();
    if (!file) return sendError(reply, 400, 'NO_FILE', 'No file uploaded');

    try {
      const path = await saveUploadedFile(file, 'users');
      const updated = await updateUser(id, { profilePicture: path });
      return sendSuccess(reply, { profilePicture: updated?.profilePicture });
    } catch (err: any) {
      return sendError(reply, 400, 'UPLOAD_ERROR', err.message);
    }
  });

    fastify.post('/:id/change-password', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Change user password',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        }),
        400: commonSchemas.errorResponse,
        403: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    if (currentUser.id !== id) {
      return sendError(reply, 403, 'FORBIDDEN', 'Cannot change another user\'s password');
    }

    const result = changePasswordSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      await changePassword(id, result.data.currentPassword, result.data.newPassword);
      return sendSuccess(reply, { message: 'Password changed successfully' });
    } catch (err: any) {
      if (err.code === 'WRONG_PASSWORD') {
        return sendError(reply, 400, 'WRONG_PASSWORD', 'Current password is incorrect');
      }
      if (err.code === 'OAUTH_ACCOUNT') {
        return sendError(reply, 400, 'OAUTH_ACCOUNT', err.message);
      }
      throw err;
    }
  });

    fastify.delete('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Delete user account',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        }),
        403: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string; role: string };

    if (currentUser.id !== id && currentUser.role !== 'admin') {
      return sendError(reply, 403, 'FORBIDDEN', 'Cannot delete another user\'s account');
    }

    await deleteUser(id);
    return sendSuccess(reply, { message: 'Account deleted successfully' });
  });

    fastify.post('/:id/follow', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Follow a user',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        }),
        400: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    try {
      await followUser(currentUser.id, id);
      return sendSuccess(reply, { message: 'Followed successfully' });
    } catch (err: any) {
      if (err.code === 'SELF_FOLLOW') {
        return sendError(reply, 400, 'SELF_FOLLOW', 'Cannot follow yourself');
      }
      throw err;
    }
  });

    fastify.delete('/:id/follow', {
    preHandler: authenticate,
    schema: {
      tags: ['users'],
      description: 'Unfollow a user',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    await unfollowUser(currentUser.id, id);
    return sendSuccess(reply, { message: 'Unfollowed successfully' });
  });

    fastify.get('/:id/followers', {
    schema: {
      tags: ['users'],
      description: 'Get user followers',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.userObject,
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query');

    const { page, limit } = query.data;
    const { rows, total } = await getFollowers(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id/following', {
    schema: {
      tags: ['users'],
      description: 'Get users that this user is following',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.userObject,
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query');

    const { page, limit } = query.data;
    const { rows, total } = await getFollowing(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id/shelves', {
    schema: {
      tags: ['shelves'],
      description: 'Get user shelves',
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isPublic: { type: 'boolean' },
              books: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    book: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        coverImage: { type: 'string', nullable: true },
                        pageCount: { type: 'integer', nullable: true },
                      },
                    },
                    progress: { type: 'integer', nullable: true },
                  },
                },
              },
            },
          },
        }),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try { await request.jwtVerify(); } catch {
    }

    const user = await getUserById(id);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    if (!user.isPublic && !isOwnerOrAdmin(request, id)) {
      return sendError(reply, 403, 'FORBIDDEN', 'This profile is private');
    }

    const rows = await getUserShelves(id);
        return sendSuccess(reply, rows);
  });

    fastify.get('/:id/ratings', {
    schema: {
      tags: ['ratings'],
      description: 'Get user ratings',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.ratingObject,
        }),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query');

    try { await request.jwtVerify(); } catch {
    }

    const user = await getUserById(id);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    if (!user.isPublic && !isOwnerOrAdmin(request, id)) {
      return sendError(reply, 403, 'FORBIDDEN', 'This profile is private');
    }

    const { page, limit } = query.data;
    const rows = await getUserRatings(id, page, limit, isOwnerOrAdmin(request, id));
    return sendSuccess(reply, rows);
  });

    fastify.get('/:id/quotes', {
    schema: {
      tags: ['quotes'],
      description: 'Get user quotes',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.quoteObject,
        }),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query');

    try { await request.jwtVerify(); } catch {
    }

    const user = await getUserById(id);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    if (!user.isPublic && !isOwnerOrAdmin(request, id)) {
      return sendError(reply, 403, 'FORBIDDEN', 'This profile is private');
    }

    const { page, limit } = query.data;
    const rows = await getUserQuotes(id, page, limit, isOwnerOrAdmin(request, id));
    return sendSuccess(reply, rows);
  });

    fastify.get('/:id/collections', {
    schema: {
      tags: ['collections'],
      description: 'Get user collections',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.collectionObject,
        }),
        403: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query');

    try { await request.jwtVerify(); } catch {
    }

    const user = await getUserById(id);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    if (!user.isPublic && !isOwnerOrAdmin(request, id)) {
      return sendError(reply, 403, 'FORBIDDEN', 'This profile is private');
    }

    const { page, limit } = query.data;
    const rows = await getUserCollections(id, page, limit, isOwnerOrAdmin(request, id));
    return sendSuccess(reply, rows);
  });
}
