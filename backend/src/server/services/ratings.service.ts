import { eq, and, count, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { ratings, books, users, likes, follows } from '../db/schema/index.js';

export async function getRatingById(id: string) {
  return db.query.ratings.findFirst({
    where: eq(ratings.id, id),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      book: {
        columns: {
          id: true,
          title: true,
          coverImage: true,
        },
      },
    },
  });
}

export async function getRatingsByBook(bookId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.ratings.findMany({
      where: eq(ratings.bookId, bookId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [desc(ratings.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(ratings).where(eq(ratings.bookId, bookId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getRatingsByUser(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.ratings.findMany({
      where: eq(ratings.userId, userId),
      with: {
        book: {
          columns: {
            id: true,
            title: true,
            coverImage: true,
            averageRating: true,
          },
        },
      },
      orderBy: [desc(ratings.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(ratings).where(eq(ratings.userId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getUserRatingForBook(userId: string, bookId: string) {
  return db.query.ratings.findFirst({
    where: and(eq(ratings.userId, userId), eq(ratings.bookId, bookId)),
  });
}

export async function listRatings(opts: {
  page: number;
  limit: number;
  bookId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  hasReview?: boolean;
  fromFollowed?: boolean;
    currentUserId?: string;
    sortBy?: 'created' | 'rating' | 'likes';
    sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, bookId, userId, minRating, maxRating, hasReview,
    fromFollowed, currentUserId, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (bookId) conditions.push(eq(ratings.bookId, bookId));
  if (userId) conditions.push(eq(ratings.userId, userId));
  if (minRating !== undefined) conditions.push(sql`${ratings.rating} >= ${minRating}`);
  if (maxRating !== undefined) conditions.push(sql`${ratings.rating} <= ${maxRating}`);
  if (hasReview !== undefined) {
    if (hasReview) {
      conditions.push(sql`${ratings.review} IS NOT NULL`);
    } else {
      conditions.push(sql`${ratings.review} IS NULL`);
    }
  }

    if (fromFollowed && currentUserId) {
    const followedRows = await db
      .select({ followedId: follows.followedId })
      .from(follows)
      .where(eq(follows.followerId, currentUserId));
    const followedIds = followedRows.map((r) => r.followedId);
    if (followedIds.length > 0) {
      conditions.push(inArray(ratings.userId, followedIds));
    } else {
        return { rows: [], total: 0 };
    }
  }

  let query = db.select({
    id: ratings.id,
    userId: ratings.userId,
    bookId: ratings.bookId,
    rating: ratings.rating,
    review: ratings.review,
    createdAt: ratings.createdAt,
    updatedAt: ratings.updatedAt,
    user: {
      id: users.id,
      username: users.username,
      profilePicture: users.profilePicture,
    },
    book: {
      id: books.id,
      title: books.title,
      coverImage: books.coverImage,
    },
  }).from(ratings)
    .innerJoin(users, eq(users.id, ratings.userId))
    .innerJoin(books, eq(books.id, ratings.bookId))
    .$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

    if (sortBy === 'likes') {
        const likeCountSubq = sql<number>`(
      SELECT COUNT(*) FROM likes l
      WHERE l.likeable_id = ${ratings.id}
      AND l.likeable_type = 'rating'
    )`;
    query = query.orderBy(sortOrder === 'asc' ? asc(likeCountSubq) : desc(likeCountSubq));
  } else {
    const orderColumn = sortBy === 'rating' ? ratings.rating : ratings.createdAt;
    query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));
  }

  const rows = await query.limit(limit).offset(offset);

    const countQuery = db.select({ value: count() }).from(ratings);
  const [{ value: total }] = conditions.length > 0
    ? await countQuery.where(and(...conditions))
    : await countQuery;

  return { rows, total: Number(total) };
}

export async function createRating(userId: string, data: {
  bookId: string;
  rating: number;
  review?: string;
}) {
  const existing = await getUserRatingForBook(userId, data.bookId);
  if (existing) {
    throw Object.assign(new Error('You have already rated this book'), { code: 'ALREADY_RATED' });
  }

  const [rating] = await db
    .insert(ratings)
    .values({
      userId,
      bookId: data.bookId,
      rating: data.rating,
      review: data.review || null,
    })
    .returning();

  await updateBookAverageRating(data.bookId);

  return rating;
}

export async function updateRating(
  id: string,
  userId: string,
  data: {
    rating?: number;
    review?: string;
  },
) {
  const existing = await getRatingById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Rating not found'), { code: 'NOT_FOUND' });
  }

  const [updated] = await db
    .update(ratings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(ratings.id, id))
    .returning();

  if (data.rating !== undefined) {
    await updateBookAverageRating(existing.bookId);
  }

  return updated;
}

export async function deleteRating(id: string, userId: string) {
  const existing = await getRatingById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Rating not found'), { code: 'NOT_FOUND' });
  }

  await db.delete(ratings).where(eq(ratings.id, id));

  await updateBookAverageRating(existing.bookId);
}

async function updateBookAverageRating(bookId: string) {
  const result = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${ratings.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eq(ratings.bookId, bookId));

  const avgRating = Number(result[0].avg).toFixed(2);

  await db
    .update(books)
    .set({ averageRating: avgRating })
    .where(eq(books.id, bookId));
}
