import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireRole.js';
import {
  listPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
  getPublisherBooks,
} from '../services/publishers.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';
import { saveUploadedFile } from '../utils/upload.js';

const listPublishersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  sortBy: z.enum(['name', 'created']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createPublisherSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  website: z.string().url().optional(),
  country: z.string().max(50).optional(),
  foundedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional(),
  logo: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().max(50).optional(),
});

const updatePublisherSchema = createPublisherSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export async function publishersHandler(fastify: FastifyInstance) {
    fastify.get('/', async (request, reply) => {
    const query = listPublishersSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { rows, total } = await listPublishers(query.data);
    return sendSuccess(reply, rows, buildPaginationMeta(total, query.data.page, query.data.limit));
  });

    fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const publisher = await getPublisherById(id);
    if (!publisher) return sendError(reply, 404, 'NOT_FOUND', 'Publisher not found');
    return sendSuccess(reply, publisher);
  });

    fastify.post('/', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const result = createPublisherSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const publisher = await createPublisher(result.data);
      return sendSuccess(reply, publisher, undefined, 201);
    } catch (error: any) {
      return sendError(reply, 500, 'CREATE_ERROR', error.message);
    }
  });

    fastify.patch('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updatePublisherSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const publisher = await updatePublisher(id, result.data);
      if (!publisher) return sendError(reply, 404, 'NOT_FOUND', 'Publisher not found');
      return sendSuccess(reply, publisher);
    } catch (error: any) {
      return sendError(reply, 500, 'UPDATE_ERROR', error.message);
    }
  });

    fastify.delete('/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deletePublisher(id);
      return sendSuccess(reply, { message: 'Publisher deleted successfully' });
    } catch (error: any) {
      return sendError(reply, 500, 'DELETE_ERROR', error.message);
    }
  });

    fastify.get('/:id/books', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = paginationSchema.safeParse(request.query);
    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const { page, limit } = query.data;
    const { rows, total } = await getPublisherBooks(id, page, limit);
    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/:id/logo', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = await request.file();
      if (!data) {
        return sendError(reply, 400, 'NO_FILE', 'No file uploaded');
      }

      const filename = await saveUploadedFile(data, 'publishers');
      const publisher = await updatePublisher(id, { logo: filename });

      if (!publisher) return sendError(reply, 404, 'NOT_FOUND', 'Publisher not found');
      return sendSuccess(reply, { logo: filename });
    } catch (error: any) {
      return sendError(reply, 500, 'UPLOAD_ERROR', error.message);
    }
  });
}
