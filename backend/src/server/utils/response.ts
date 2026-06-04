import type { FastifyReply } from 'fastify';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess(
  reply: FastifyReply,
  data: unknown,
  meta?: PaginationMeta,
  statusCode = 200,
) {
  return reply.status(statusCode).send({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

export function getPagination(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
