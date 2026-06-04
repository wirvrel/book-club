import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookRatings,
} from '../services/books.service.js';
import { getQuotesByBook } from '../services/quotes.service.js';
import { createProposal } from '../services/proposals.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';
import { saveUploadedFile } from '../utils/upload.js';
import { commonSchemas } from '../utils/schemas.js';

const listBooksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().transform(v => v === '' ? undefined : v),
  genreIds: z.string().optional().transform(v => v === '' ? undefined : v),
  authorIds: z.string().optional().transform(v => v === '' ? undefined : v),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  minYear: z.coerce.number().int().optional(),
  maxYear: z.coerce.number().int().optional(),
  languages: z.string().optional().transform(v => v === '' ? undefined : v),
  ageRestriction: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['0+', '6+', '12+', '16+', '18+']).optional()
  ),
  isBestseller: z.coerce.boolean().optional(),
  sortBy: z.enum(['rating', 'title', 'year', 'reviews', 'created']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  plot: z.string().optional(),
  history: z.string().optional(),
  seriesId: z.string().uuid().optional(),
  numberInSeries: z.number().int().positive().optional(),
  pageCount: z.number().int().positive().optional(),
  languages: z.array(z.string()).optional(),
  ageRestriction: z.enum(['0+', '6+', '12+', '16+', '18+']).optional(),
  coverImage: z.string().optional(),
  funFacts: z.array(z.string()).optional(),
  adaptations: z.array(z.string()).optional(),
  isBestseller: z.boolean().optional(),
  authorIds: z.array(z.string().uuid()).optional(),
  genreIds: z.array(z.string().uuid()).optional(),
});

const updateBookSchema = createBookSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const bookQuotesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeSpoilers: z.coerce.boolean().default(false),
});

const proposeBookSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  isbn: z.string().length(13).optional(),
  publishedDate: z.string().optional(),
});

export async function booksHandler(fastify: FastifyInstance) {
    fastify.get('/', {
    schema: {
      tags: ['books'],
      description: 'Get list of books with filters',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string' },
          genreIds: { type: 'string' },
          authorIds: { type: 'string' },
          minRating: { type: 'number', minimum: 0, maximum: 5 },
          maxRating: { type: 'number', minimum: 0, maximum: 5 },
          minYear: { type: 'integer' },
          maxYear: { type: 'integer' },
          languages: { type: 'string' },
          ageRestriction: { 
            type: 'string', 
            anyOf: [
              { enum: ['0+', '6+', '12+', '16+', '18+'] },
              { const: '' }
            ]
          },
          isBestseller: { type: 'boolean' },
          sortBy: { type: 'string', enum: ['rating', 'title', 'year', 'reviews', 'created'], default: 'created' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.bookObject,
        }),
      },
    },
  }, async (request, reply) => {
    const query = listBooksSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { genreIds, authorIds, languages, ...rest } = query.data;

    const opts = {
      ...rest,
      genreIds: genreIds ? genreIds.split(',') : undefined,
      authorIds: authorIds ? authorIds.split(',') : undefined,
      languages: languages ? languages.split(',') : undefined,
    };

    const { rows, total } = await listBooks(opts);
    return sendSuccess(reply, rows, buildPaginationMeta(total, opts.page, opts.limit));
  });

    fastify.get('/:id', {
    schema: {
      tags: ['books'],
      description: 'Get book by ID',
      params: commonSchemas.idParam,
      response: {
        200: commonSchemas.successResponse(commonSchemas.bookObject),
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const book = await getBookById(id);
    if (!book) return sendError(reply, 404, 'NOT_FOUND', 'Book not found');
    return sendSuccess(reply, book);
  });

    fastify.post('/', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['books'],
      description: 'Create a new book (Admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          plot: { type: 'string' },
          history: { type: 'string' },
          seriesId: { type: 'string', format: 'uuid' },
          numberInSeries: { type: 'integer', minimum: 1 },
          pageCount: { type: 'integer', minimum: 1 },
          languages: { type: 'array', items: { type: 'string' } },
          ageRestriction: { type: 'string', enum: ['0+', '6+', '12+', '16+', '18+'] },
          coverImage: { type: 'string' },
          funFacts: { type: 'array', items: { type: 'string' } },
          adaptations: { type: 'array', items: { type: 'string' } },
          isBestseller: { type: 'boolean' },
          authorIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          genreIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        201: commonSchemas.successResponse(commonSchemas.bookObject),
        400: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const result = createBookSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const book = await createBook(result.data);
      return sendSuccess(reply, book, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['books'],
      description: 'Update book (Admin only)',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          plot: { type: 'string' },
          history: { type: 'string' },
          seriesId: { type: 'string', format: 'uuid' },
          numberInSeries: { type: 'integer', minimum: 1 },
          pageCount: { type: 'integer', minimum: 1 },
          languages: { type: 'array', items: { type: 'string' } },
          ageRestriction: { type: 'string', enum: ['0+', '6+', '12+', '16+', '18+'] },
          coverImage: { type: 'string' },
          funFacts: { type: 'array', items: { type: 'string' } },
          adaptations: { type: 'array', items: { type: 'string' } },
          isBestseller: { type: 'boolean' },
          authorIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          genreIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        200: commonSchemas.successResponse(commonSchemas.bookObject),
        400: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateBookSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const book = await updateBook(id, result.data);
      if (!book) return sendError(reply, 404, 'NOT_FOUND', 'Book not found');
      return sendSuccess(reply, book);
    } catch (error: any) {
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['books'],
      description: 'Delete book (Admin only)',
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
    try {
      await deleteBook(id);
      return sendSuccess(reply, { message: 'Book deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.get('/:id/ratings', {
    schema: {
      tags: ['ratings'],
      description: 'Get ratings for a book',
      params: commonSchemas.idParam,
      querystring: commonSchemas.paginationQuery,
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.ratingObject,
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
    const { rows, total } = await getBookRatings(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.get('/:id/quotes', {
    schema: {
      tags: ['quotes'],
      description: 'Get quotes from a book',
      params: commonSchemas.idParam,
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          includeSpoilers: { type: 'boolean', default: false },
        },
      },
      response: {
        200: commonSchemas.successResponse({
          type: 'array',
          items: commonSchemas.quoteObject,
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = bookQuotesSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit, includeSpoilers } = query.data;
    const { rows, total } = await getQuotesByBook(id, page, limit, includeSpoilers);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/:id/cover', {
    preHandler: [authenticate, requireAdmin],
    schema: {
      tags: ['books'],
      description: 'Upload book cover (Admin only)',
      security: [{ bearerAuth: [] }],
      params: commonSchemas.idParam,
      consumes: ['multipart/form-data'],
      response: {
        200: commonSchemas.successResponse({
          type: 'object',
          properties: {
            coverImage: { type: 'string' },
          },
        }),
        400: commonSchemas.errorResponse,
        404: commonSchemas.errorResponse,
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = await request.file();
      if (!data) {
        return sendError(reply, 400, 'NO_FILE', 'No file uploaded');
      }

      const filename = await saveUploadedFile(data, 'books');
      const book = await updateBook(id, { coverImage: filename });

      if (!book) return sendError(reply, 404, 'NOT_FOUND', 'Book not found');
      return sendSuccess(reply, { coverImage: filename });
    } catch (error: any) {
      return sendError(reply, 500, 'UPLOAD_ERROR', error.message);
    }
  });

    fastify.post('/propose', {
    preHandler: authenticate,
    schema: {
      tags: ['proposals'],
      description: 'Propose a new book',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          coverImage: { type: 'string' },
          pageCount: { type: 'integer', minimum: 1 },
          isbn: { type: 'string', minLength: 13, maxLength: 13 },
          publishedDate: { type: 'string' },
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
    const result = proposeBookSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const proposal = await createProposal(currentUser.id, {
        ...result.data,
        type: 'book',
      });
      return sendSuccess(reply, proposal, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });
}
