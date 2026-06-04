import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  getDashboardStats,
  getRecentProposals,
  getRecentRatings,
  updateUserRole,
  banUser,
  deleteUserAccount,
  getAllUsers,
  getAllBooks,
  deleteBookById,
} from '../services/admin.service.js';
import { updateUser } from '../services/users.service.js';
import { deleteAuthor } from '../services/authors.service.js';
import { deletePublisher } from '../services/publishers.service.js';
import { deleteGenre } from '../services/genres.service.js';
import { 
  listProposals, 
  approveProposal, 
  rejectProposal 
} from '../services/proposals.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listProposalsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['book', 'author']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  sortBy: z.enum(['created']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const userListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  sortBy: z.enum(['created', 'username']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const bookListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['created', 'title', 'rating']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'banned']),
});

const banSchema = z.object({
  banned: z.boolean(),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'banned']).optional(),
  isPublic: z.boolean().optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
});

const approveSchema = z.object({
  adminNotes: z.string().optional(),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

export async function adminHandler(fastify: FastifyInstance) {
    fastify.get('/dashboard', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get general platform statistics',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const stats = await getDashboardStats();
    return sendSuccess(reply, stats);
  });

    fastify.get('/dashboard/proposals', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get recent pending content proposals',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const proposals = await getRecentProposals(10);
    return sendSuccess(reply, proposals);
  });

    fastify.get('/dashboard/ratings', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get recent book ratings and reviews',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const ratings = await getRecentRatings(10);
    return sendSuccess(reply, ratings);
  });

    fastify.get('/proposals', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get list of all proposals with filters',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const query = listProposalsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listProposals(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.patch('/proposals/:id/approve', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Approve a content proposal',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = approveSchema.safeParse(request.body || {});

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const proposal = await approveProposal(id, currentUser.id, result.data.adminNotes);
      return sendSuccess(reply, proposal);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') return sendError(reply, 404, 'NOT_FOUND', error.message);
      if (error.code === 'ALREADY_PROCESSED') return sendError(reply, 409, 'ALREADY_PROCESSED', error.message);
      if (error.code === 'INVALID_PROPOSAL') return sendError(reply, 422, 'INVALID_PROPOSAL', error.message);
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });

    fastify.patch('/proposals/:id/reject', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Reject a content proposal',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = rejectSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const proposal = await rejectProposal(id, currentUser.id, result.data.rejectionReason);
      return sendSuccess(reply, proposal);
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') return sendError(reply, 404, 'NOT_FOUND', error.message);
      if (error.code === 'ALREADY_PROCESSED') return sendError(reply, 409, 'ALREADY_PROCESSED', error.message);
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });

    fastify.get('/users', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get list of all users with filters',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const query = userListSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await getAllUsers(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.patch('/users/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Update user account details',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateUserSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const updated = await updateUser(id, result.data);
      if (!updated) return sendError(reply, 404, 'NOT_FOUND', 'User not found');
      return sendSuccess(reply, updated);
    } catch (error: any) {
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.patch('/users/:id/role', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Change a users role',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateRoleSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const user = await updateUserRole(id, result.data.role);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');
    return sendSuccess(reply, user);
  });

    fastify.patch('/users/:id/ban', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Ban or unban a user',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = banSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const user = await banUser(id, result.data.banned);
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');
    return sendSuccess(reply, user);
  });

    fastify.delete('/users/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Permanently delete a users account',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteUserAccount(id);
    return sendSuccess(reply, { message: 'User deleted successfully' });
  });

    fastify.get('/books', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Get list of all books (Admin view)',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const query = bookListSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await getAllBooks(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.delete('/books/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Permanently delete a book',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteBookById(id);
    return sendSuccess(reply, { message: 'Book deleted successfully' });
  });

    fastify.delete('/authors/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Permanently delete an author',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deleteAuthor(id);
      return sendSuccess(reply, { message: 'Author deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.delete('/publishers/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Permanently delete a publisher',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deletePublisher(id);
      return sendSuccess(reply, { message: 'Publisher deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.delete('/genres/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['admin'],
      description: 'Permanently delete a genre',
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
}
