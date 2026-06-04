import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { likes, ratings, quotes, comments, collections } from '../db/schema/index.js';

export type LikeableType = 'rating' | 'quote' | 'comment' | 'collection';

export async function addLike(
  userId: string,
  likeableId: string,
  likeableType: LikeableType,
) {
  const [like] = await db
    .insert(likes)
    .values({
      userId,
      likeableId,
      likeableType,
    })
    .onConflictDoNothing()
    .returning();

    if (!like) {
    const existing = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, userId),
        eq(likes.likeableId, likeableId),
        eq(likes.likeableType, likeableType),
      ),
    });
    return existing;
  }

  return like;
}

export async function removeLike(userId: string, likeableId: string, likeableType: LikeableType) {
  const existing = await db.query.likes.findFirst({
    where: and(
      eq(likes.userId, userId),
      eq(likes.likeableId, likeableId),
      eq(likes.likeableType, likeableType),
    ),
  });

  if (!existing) {
    return null;
  }

  await db
    .delete(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.likeableId, likeableId),
      eq(likes.likeableType, likeableType),
    ));

  return existing;
}

export async function getLikeCount(likeableId: string, likeableType: LikeableType) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(likes)
    .where(and(
      eq(likes.likeableId, likeableId),
      eq(likes.likeableType, likeableType),
    ));

  return Number(value);
}

export async function getLikesByUser(
  userId: string,
  page: number,
  limit: number,
  likeableType?: LikeableType,
) {
  const offset = (page - 1) * limit;

  const conditions = [eq(likes.userId, userId)];
  if (likeableType) {
    conditions.push(eq(likes.likeableType, likeableType));
  }

  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.likes.findMany({
      where,
      orderBy: (likes, { desc }) => [desc(likes.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(likes).where(where),
  ]);

  return { rows, total: Number(total) };
}

export async function isLikedByUser(userId: string, likeableId: string, likeableType: LikeableType) {
  const like = await db.query.likes.findFirst({
    where: and(
      eq(likes.userId, userId),
      eq(likes.likeableId, likeableId),
      eq(likes.likeableType, likeableType),
    ),
  });

  return !!like;
}

export async function getLikedItems(userId: string, likeableType: LikeableType) {
  const items = await db.query.likes.findMany({
    where: and(
      eq(likes.userId, userId),
      eq(likes.likeableType, likeableType),
    ),
    orderBy: (likes, { desc }) => [desc(likes.createdAt)],
  });

  return items.map((like) => like.likeableId);
}
