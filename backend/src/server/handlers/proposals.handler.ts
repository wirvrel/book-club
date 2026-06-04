import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  getProposalById,
  listProposals,
  getUserProposals,
  createProposal,
  approveProposal,
  rejectProposal,
  deleteProposal,
} from '../services/proposals.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createBookProposalSchema = z.object({
  type: z.literal('book'),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  isbn: z.string().length(13).optional(),
  publishedDate: z.string().optional(),
});

const createAuthorProposalSchema = z.object({
  type: z.literal('author'),
  name: z.string().min(1).max(100),
  bio: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(100).optional(),
  nationality: z.string().max(50).optional(),
  typeOfWork: z.string().max(50).optional(),
  profilePicture: z.string().optional(),
});

const approveSchema = z.object({
  adminNotes: z.string().optional(),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

const listProposalsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['book', 'author']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(['created']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function proposalsHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['proposals'],
      description: 'Get list of all proposals (Admin only)',
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

    fastify.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['proposals'],
      description: "Get current user's content proposals",
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const query = listProposalsSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getUserProposals(currentUser.id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['proposals'],
      description: 'Get proposal details by ID',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string; role: string };

    const proposal = await getProposalById(id);
    if (!proposal) return sendError(reply, 404, 'NOT_FOUND', 'Proposal not found');

    if (currentUser.role !== 'admin' && proposal.userId !== currentUser.id) {
      return sendError(reply, 403, 'FORBIDDEN', 'Access denied');
    }

    return sendSuccess(reply, proposal);
  });

    fastify.post('/', {
    preHandler: authenticate,
    schema: {
      tags: ['proposals'],
      description: 'Create a new content proposal',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };

    const bookResult = createBookProposalSchema.safeParse(request.body);
    const authorResult = createAuthorProposalSchema.safeParse(request.body);

    if (!bookResult.success && !authorResult.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input');
    }

    const data = bookResult.success ? bookResult.data : authorResult.data;
    const proposal = await createProposal(currentUser.id, data as any);
    return sendSuccess(reply, proposal, undefined, 201);
  });

    fastify.delete('/:id', {
    preHandler: authenticate,
    schema: {
      tags: ['proposals'],
      description: 'Delete a pending proposal',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    try {
      await deleteProposal(id, currentUser.id);
      return sendSuccess(reply, { message: 'Proposal deleted successfully' });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') return sendError(reply, 404, 'NOT_FOUND', error.message);
      if (error.code === 'ALREADY_PROCESSED') return sendError(reply, 400, 'ALREADY_PROCESSED', error.message);
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.patch('/:id/approve', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['proposals'],
      description: 'Approve a content proposal (Admin only)',
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

    fastify.patch('/:id/reject', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['proposals'],
      description: 'Reject a content proposal (Admin only)',
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
}
