import type { FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from '../utils/response.js';

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role?: string } | undefined;
    if (!user || !roles.includes(user.role ?? '')) {
      return sendError(reply, 403, 'FORBIDDEN', 'Insufficient permissions');
    }
  };
}

export const requireAdmin = requireRole('admin');
