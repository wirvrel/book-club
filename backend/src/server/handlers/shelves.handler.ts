import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  getShelvesByUserId,
  getShelfById,
  createShelf,
  updateShelf,
  deleteShelf,
  addBookToShelf,
  removeBookFromShelf,
  updateBookProgress,
  getBooksOnShelf,
  moveBookToShelf,
  isDefaultShelf,
} from '../services/shelves.service.js';
import { sendSuccess, sendError, buildPaginationMeta } from '../utils/response.js';

const createShelfSchema = z.object({
  name: z.string().min(1).max(50),
});

const updateShelfSchema = z.object({
  name: z.string().min(1).max(50),
});

const addBookSchema = z.object({
  bookId: z.string().uuid(),
  readingFormat: z.enum(['physical', 'ebook', 'audiobook', 'other']).optional(),
  startDate: z.string().optional(),
  readDate: z.string().optional(),
  progressPages: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const updateProgressSchema = z.object({
  progressPages: z.number().int().min(0).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  readDate: z.string().optional(),
  readingFormat: z.enum(['physical', 'ebook', 'audiobook', 'other']).optional(),
  isPrivate: z.boolean().optional(),
});

const moveBookSchema = z.object({
  fromShelfId: z.string().uuid(),
  toShelfId: z.string().uuid(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function shelvesHandler(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const shelves = await getShelvesByUserId(currentUser.id);
    return sendSuccess(reply, shelves);
  });

    fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    return sendSuccess(reply, shelf);
  });

    fastify.get('/:id/books', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const query = paginationSchema.safeParse(request.query);

    if (!query.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid query', query.error.flatten());
    }

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    const { page, limit } = query.data;
    const { rows, total } = await getBooksOnShelf(currentUser.id, id, page, limit);

    return sendSuccess(reply, rows, buildPaginationMeta(total, page, limit));
  });

    fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const currentUser = request.user as { id: string };
    const result = createShelfSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const shelf = await createShelf(currentUser.id, result.data.name);
    return sendSuccess(reply, shelf, undefined, 201);
  });

    fastify.patch('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = updateShelfSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

        if (isDefaultShelf(shelf.name)) {
      return sendError(reply, 400, 'FORBIDDEN', 'Cannot rename a default shelf');
    }

    const updated = await updateShelf(id, currentUser.id, result.data.name);
    if (!updated) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    return sendSuccess(reply, updated);
  });

    fastify.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    if (isDefaultShelf(shelf.name)) {
      return sendError(reply, 400, 'FORBIDDEN', 'Cannot delete a default shelf');
    }

    await deleteShelf(id, currentUser.id);
    return sendSuccess(reply, { message: 'Shelf deleted successfully' });
  });

    fastify.post('/:id/books', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };
    const result = addBookSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const userBook = await addBookToShelf(currentUser.id, id, result.data.bookId, {
        readingFormat: result.data.readingFormat,
        startDate: result.data.startDate,
        readDate: result.data.readDate,
        progressPages: result.data.progressPages,
        rating: result.data.rating,
        notes: result.data.notes,
        isPrivate: result.data.isPrivate,
      });
      return sendSuccess(reply, userBook, undefined, 201);
    } catch (error: any) {
      if (error.code === 'SHELF_NOT_FOUND') {
        return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');
      }
      return sendError(reply, 500, 'ERROR', error.message);
    }
  });

    fastify.delete('/:id/books/:bookId', { preHandler: authenticate }, async (request, reply) => {
    const { id, bookId } = request.params as { id: string; bookId: string };
    const currentUser = request.user as { id: string };

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    await removeBookFromShelf(currentUser.id, id, bookId);
    return sendSuccess(reply, { message: 'Book removed from shelf' });
  });

    fastify.patch('/:id/books/:bookId', { preHandler: authenticate }, async (request, reply) => {
    const { id, bookId } = request.params as { id: string; bookId: string };
    const currentUser = request.user as { id: string };
    const result = updateProgressSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Shelf not found');

    const updated = await updateBookProgress(currentUser.id, id, bookId, result.data);
    if (!updated) return sendError(reply, 404, 'NOT_FOUND', 'Book not found on this shelf');

    return sendSuccess(reply, updated);
  });

    fastify.post('/:id/books/:bookId/move', { preHandler: authenticate }, async (request, reply) => {
    const { id, bookId } = request.params as { id: string; bookId: string };
    const currentUser = request.user as { id: string };
    const result = moveBookSchema.safeParse(request.body);

    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    const { fromShelfId, toShelfId } = result.data;

    if (fromShelfId !== id) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'fromShelfId must match the URL parameter');
    }

    const shelf = await getShelfById(id, currentUser.id);
    if (!shelf) return sendError(reply, 404, 'NOT_FOUND', 'Source shelf not found');

    const toShelf = await getShelfById(toShelfId, currentUser.id);
    if (!toShelf) return sendError(reply, 404, 'NOT_FOUND', 'Destination shelf not found');

    const moved = await moveBookToShelf(currentUser.id, bookId, fromShelfId, toShelfId);
    if (!moved) return sendError(reply, 404, 'NOT_FOUND', 'Book not found on source shelf');

    return sendSuccess(reply, moved);
  });
}
