import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { favorites } from '../db/schema/index.js';

export type FavoriteableType = 'book' | 'collection' | 'author';

export async function addFavorite(
  userId: string,
  favoriteableId: string,
  favoriteableType: FavoriteableType,
) {
    const existing = await db.query.favorites.findFirst({
    where: and(
      eq(favorites.userId, userId),
      eq(favorites.favoriteableId, favoriteableId),
      eq(favorites.favoriteableType, favoriteableType),
    ),
  });

  if (existing) {
    return existing;
  }

  const [favorite] = await db
    .insert(favorites)
    .values({ userId, favoriteableId, favoriteableType })
    .returning();

  return favorite;
}

export async function removeFavorite(
  userId: string,
  favoriteableId: string,
  favoriteableType: FavoriteableType,
) {
  const existing = await db.query.favorites.findFirst({
    where: and(
      eq(favorites.userId, userId),
      eq(favorites.favoriteableId, favoriteableId),
      eq(favorites.favoriteableType, favoriteableType),
    ),
  });

  if (!existing) return null;

  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.favoriteableId, favoriteableId),
        eq(favorites.favoriteableType, favoriteableType),
      ),
    );

  return existing;
}

export async function isFavoritedByUser(
  userId: string,
  favoriteableId: string,
  favoriteableType: FavoriteableType,
) {
  const favorite = await db.query.favorites.findFirst({
    where: and(
      eq(favorites.userId, userId),
      eq(favorites.favoriteableId, favoriteableId),
      eq(favorites.favoriteableType, favoriteableType),
    ),
  });

  return !!favorite;
}

export async function getFavoritesByUser(
  userId: string,
  favoriteableType: FavoriteableType | undefined,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  const conditions = [eq(favorites.userId, userId)];
  if (favoriteableType) {
    conditions.push(eq(favorites.favoriteableType, favoriteableType));
  }

  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.favorites.findMany({
      where,
      orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(favorites).where(where),
  ]);

  return { rows, total: Number(total) };
}

export async function getFavoriteCount(
  favoriteableId: string,
  favoriteableType: FavoriteableType,
) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(favorites)
    .where(
      and(
        eq(favorites.favoriteableId, favoriteableId),
        eq(favorites.favoriteableType, favoriteableType),
      ),
    );

  return Number(value);
}
