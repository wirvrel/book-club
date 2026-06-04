import type { FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from '../utils/response.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
      const user = request.user as { role?: string } | undefined;
    if (user?.role === 'banned') {
      return sendError(reply, 403, 'BANNED', 'Your account has been suspended');
    }
  } catch {
    return sendError(reply, 401, 'UNAUTHORIZED', 'Authentication required');
  }
}

export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
  }
}
