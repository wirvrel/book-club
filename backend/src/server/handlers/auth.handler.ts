import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import {
  registerUser,
  loginUser,
  generateTokens,
  findOrCreateGoogleUser,
} from '../services/auth.service.js';
import { getUserById } from '../services/users.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { commonSchemas } from '../utils/schemas.js';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authHandler(fastify: FastifyInstance) {
    fastify.post('/register', {
    schema: {
      tags: ['auth'],
      description: 'Register a new user',
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const result = registerSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const user = await registerUser(result.data);
      const tokens = generateTokens(fastify, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      return sendSuccess(
        reply,
        {
          accessToken: tokens.accessToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
        undefined,
        201,
      );
    } catch (err: any) {
      if (err.code === 'EMAIL_TAKEN') {
        return sendError(reply, 409, 'EMAIL_TAKEN', 'Email is already in use');
      }
      if (err.code === 'USERNAME_TAKEN') {
        return sendError(reply, 409, 'USERNAME_TAKEN', 'Username is already in use');
      }
      throw err;
    }
  });

    fastify.post('/login', {
    schema: {
      tags: ['auth'],
      description: 'Login with email and password',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    profilePicture: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten());
    }

    try {
      const user = await loginUser(result.data);
      const tokens = generateTokens(fastify, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      return sendSuccess(reply, {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      });
    } catch (err: any) {
      if (err.code === 'INVALID_CREDENTIALS') {
        return sendError(reply, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      throw err;
    }
  });

    fastify.post('/logout', {
    preHandler: authenticate,
    schema: {
      tags: ['auth'],
      description: 'Logout current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    return sendSuccess(reply, { message: 'Logged out successfully' });
  });

    fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      description: 'Refresh access token using refresh token from cookie',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      return sendError(reply, 401, 'NO_REFRESH_TOKEN', 'Refresh token not found');
    }

    try {
      const payload = fastify.jwt.verify<{ id: string; email: string; role: string }>(
        refreshToken,
      );

      const user = await db.query.users.findFirst({ where: eq(users.id, payload.id) });
      if (!user) {
        return sendError(reply, 401, 'USER_NOT_FOUND', 'User not found');
      }

      const tokens = generateTokens(fastify, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      return sendSuccess(reply, { accessToken: tokens.accessToken });
    } catch {
      return sendError(reply, 401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }
  });

    fastify.get('/me', {
    preHandler: authenticate,
    schema: {
      tags: ['auth'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: commonSchemas.successResponse(commonSchemas.userObject),
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const payload = request.user as { id: string };
    const user = await getUserById(payload.id);
    if (!user) {
      return sendError(reply, 404, 'USER_NOT_FOUND', 'User not found');
    }

    return sendSuccess(reply, user);
  });

    fastify.get('/google', {
    schema: {
      tags: ['auth'],
      description: 'Initiate Google OAuth flow',
      response: {
        302: {
          description: 'Redirect to Google OAuth',
          type: 'null',
        },
      },
    },
  }, async (request, reply) => {
        return reply.generateAuthorizationUri(request, reply);
  });

    fastify.get('/google/callback', {
    schema: {
      tags: ['auth'],
      description: 'Google OAuth callback handler',
      response: {
        302: {
          description: 'Redirect to home or login page',
          type: 'null',
        },
      },
    },
  }, async (request, reply) => {
    try {
        const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const profile = (await userInfoRes.json()) as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      const user = await findOrCreateGoogleUser(profile);
      const tokens = generateTokens(fastify, {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

        reply.setCookie('accessToken', tokens.accessToken, {
        httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
        });

      return reply.redirect('/');
    } catch (err) {
      fastify.log.error(err);
      return reply.redirect('/login?error=oauth_failed');
    }
  });
}
