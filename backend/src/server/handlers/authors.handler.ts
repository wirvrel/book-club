import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  listAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
} from '../services/authors.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';
import { saveUploadedFile } from '../utils/upload.js';
import { createProposal } from '../services/proposals.service.js';
import {
  followAuthor,
  unfollowAuthor,
  isFollowingAuthor,
  getFollowedAuthors,
  getAuthorFollowerCount,
} from '../services/userAuthors.service.js';
import { commonSchemas } from '../utils/schemas.js';

const listAuthorsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(30),
  search: z.string().optional(),
  typeOfWork: z
    .enum([
      'novelist',
      'short_story_writer',
      'poet',
      'playwright',
      'screenwriter',
      'essayist',
      'biographer',
      'memoirist',
      'historian',
      'journalist',
      'science_writer',
      'self_help_writer',
      'children_writer',
      'young_adult_writer',
      'graphic_novelist',
      'fantasy_writer',
      'sci_fi_writer',
      'mystery_writer',
      'romance_writer',
      'horror_writer',
      'other',
    ])
    .optional(),
  sortBy: z.enum(['name', 'created']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(100).optional(),
  nationality: z.string().max(50).optional(),
  typeOfWork: z
    .enum([
      'novelist',
      'short_story_writer',
      'poet',
      'playwright',
      'screenwriter',
      'essayist',
      'biographer',
      'memoirist',
      'historian',
      'journalist',
      'science_writer',
      'self_help_writer',
      'children_writer',
      'young_adult_writer',
      'graphic_novelist',
      'fantasy_writer',
      'sci_fi_writer',
      'mystery_writer',
      'romance_writer',
      'horror_writer',
      'other',
    ])
    .optional(),
  website: z.string().url().optional(),
  profilePicture: z.string().optional(),
  deathDate: z.string().optional(),
  socialMediaLinks: z.record(z.string()).optional(),
  mediaImages: z.array(z.string()).optional(),
  mediaVideos: z.array(z.string()).optional(),
  funFacts: z.array(z.string()).optional(),
});

const updateAuthorSchema = createAuthorSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const proposeAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(100).optional(),
  nationality: z.string().max(50).optional(),
  typeOfWork: z.string().max(50).optional(),
  profilePicture: z.string().optional(),
});

export async function authorsHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    schema: {
      tags: ['authors'],
      description: 'Get list of authors',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 30 },
          search: { type: 'string' },
          typeOfWork: { type: 'string' },
          sortBy: { type: 'string', enum: ['name', 'created'], default: 'name' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
        },
      },
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.authorObject,
        }),
      },
    },
  }, async (request, reply) => {
    const query = listAuthorsSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listAuthors(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/:id', {
    schema: {
      tags: ['authors'],
      description: 'Get author by ID',
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse(commonSchemas.authorObject),
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const author = await getAuthorById(id);
    if (!author) return sendError(reply, 404, 'NOT_FOUND', 'Author not found');
    return sendSuccess(reply, author);
  });

    fastify.post('/', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['authors'],
      description: 'Create a new author (Admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        201: commonSchemas.successResponse(commonSchemas.authorObject),
        400: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const result = createAuthorSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const author = await createAuthor(result.data);
      return sendSuccess(reply, author, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['authors'],
      description: 'Update author (Admin only)',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse(commonSchemas.authorObject),
        400: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateAuthorSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const author = await updateAuthor(id, result.data);
      if (!author) return sendError(reply, 404, 'NOT_FOUND', 'Author not found');
      return sendSuccess(reply, author);
    } catch (error: any) {
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['authors'],
      description: 'Delete author (Admin only)',
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
    try {
      await deleteAuthor(id);
      return sendSuccess(reply, { message: 'Author deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.get('/:id/books', {
    schema: {
      tags: ['authors'],
      description: 'Get books by author',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.bookObject,
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getAuthorBooks(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/:id/photo', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['authors'],
      description: 'Upload author photo (Admin only)',
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
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = await request.file();
      if (!data) {
        return sendError(reply, 400, 'NO_FILE', 'No file uploaded');
      }

      const filename = await saveUploadedFile(data, 'authors');
      const author = await updateAuthor(id, { profilePicture: filename });

      if (!author) return sendError(reply, 404, 'NOT_FOUND', 'Author not found');
      return sendSuccess(reply, { profilePicture: filename });
    } catch (error: any) {
      return sendError(reply, 500, 'UPLOAD_ERROR', error.message);
    }
  });

    fastify.post('/:id/follow', {
    preHandler: authenticate,
    schema: {
      tags: ['authors'],
      description: 'Follow an author',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        }),
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    const author = await getAuthorById(id);
    if (!author) return sendError(reply, 404, 'NOT_FOUND', 'Author not found');

    await followAuthor(currentUser.id, id);
    const followerCount = await getAuthorFollowerCount(id);
    const following = await isFollowingAuthor(currentUser.id, id);
    return sendSuccess(reply, { following, followerCount });
  });

    fastify.delete('/:id/follow', {
    preHandler: authenticate,
    schema: {
      tags: ['authors'],
      description: 'Unfollow an author',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            following: { type: 'boolean' },
            followerCount: { type: 'integer' },
          },
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    await unfollowAuthor(currentUser.id, id);
    const followerCount = await getAuthorFollowerCount(id);
    return sendSuccess(reply, { following: false, followerCount });
  });

    fastify.get('/:id/followers', {
    schema: {
      tags: ['authors'],
      description: 'Get author follower count',
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            followerCount: { type: 'integer' },
          },
        }),
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const author = await getAuthorById(id);
    if (!author) return sendError(reply, 404, 'NOT_FOUND', 'Author not found');

    const followerCount = await getAuthorFollowerCount(id);
    return sendSuccess(reply, { followerCount });
  });

    fastify.post('/propose', {
    preHandler: authenticate,
    schema: {
      tags: ['authors'],
      description: 'Propose a new author',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          bio: { type: 'string' },
          birthDate: { type: 'string' },
          birthPlace: { type: 'string', maxLength: 100 },
          nationality: { type: 'string', maxLength: 50 },
          typeOfWork: { type: 'string', maxLength: 50 },
          profilePicture: { type: 'string' },
        },
      },
      response: {
        201: commonSchemas.successResponse({
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
          },
        }),
        400: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = proposeAuthorSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const proposal = await createProposal(currentUser.id, {
        ...result.data,
        type: 'author',
      });
      return sendSuccess(reply, proposal, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });
}

