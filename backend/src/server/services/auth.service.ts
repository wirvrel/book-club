import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, shelves } from '../db/schema/index.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import type { FastifyInstance } from 'fastify';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

const DEFAULT_SHELVES = ['Хочу прочитати', 'Читаю зараз', 'Прочитано'];

export async function registerUser(input: RegisterInput) {
    const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (existingEmail) {
    throw Object.assign(new Error('Email already in use'), { code: 'EMAIL_TAKEN' });
  }

  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, input.username),
  });
  if (existingUsername) {
    throw Object.assign(new Error('Username already in use'), { code: 'USERNAME_TAKEN' });
  }

  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      passwordHash,
      role: 'user',
    })
    .returning();

    await db.insert(shelves).values(
    DEFAULT_SHELVES.map((name) => ({
      userId: user.id,
      name,
    })),
  );

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS' });
  }

    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

  return user;
}

export function generateTokens(fastify: FastifyInstance, payload: JwtPayload) {
  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
  const refreshToken = fastify.jwt.sign(payload, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function findOrCreateGoogleUser(profile: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}) {
  let user = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });

  if (!user) {
      const baseUsername = profile.name.toLowerCase().replace(/\s+/g, '_').slice(0, 40);
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (!existing) break;
      username = `${baseUsername}_${counter++}`;
    }

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: profile.email,
        passwordHash: '',
          profilePicture: profile.picture ?? null,
        role: 'user',
      })
      .returning();

    user = newUser;

      await db.insert(shelves).values(
      DEFAULT_SHELVES.map((name) => ({
        userId: user!.id,
        name,
      })),
    );
  }

  return user;
}
