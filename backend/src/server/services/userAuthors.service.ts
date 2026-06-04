import { eq, and, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userAuthors, authors } from '../db/schema/index.js';

export async function followAuthor(userId: string, authorId: string) {
  const existing = await db.query.userAuthors.findFirst({
    where: and(eq(userAuthors.userId, userId), eq(userAuthors.authorId, authorId)),
  });

  if (existing) return existing;

  const [row] = await db
    .insert(userAuthors)
    .values({ userId, authorId })
    .returning();

  return row;
}

export async function unfollowAuthor(userId: string, authorId: string) {
  const existing = await db.query.userAuthors.findFirst({
    where: and(eq(userAuthors.userId, userId), eq(userAuthors.authorId, authorId)),
  });

  if (!existing) return null;

  await db
    .delete(userAuthors)
    .where(and(eq(userAuthors.userId, userId), eq(userAuthors.authorId, authorId)));

  return existing;
}

export async function isFollowingAuthor(userId: string, authorId: string): Promise<boolean> {
  const row = await db.query.userAuthors.findFirst({
    where: and(eq(userAuthors.userId, userId), eq(userAuthors.authorId, authorId)),
  });
  return !!row;
}

export async function getFollowedAuthors(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const where = eq(userAuthors.userId, userId);

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.userAuthors.findMany({
      where,
      limit,
      offset,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            profilePicture: true,
            nationality: true,
            typeOfWork: true,
          },
        },
      },
    }),
    db.select({ value: count() }).from(userAuthors).where(where),
  ]);

  return {
    rows: rows.map((r) => r.author),
    total: Number(total),
  };
}

export async function getAuthorFollowerCount(authorId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(userAuthors)
    .where(eq(userAuthors.authorId, authorId));
  return Number(value);
}
