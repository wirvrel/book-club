import { eq, and, count, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { collections, collectionBooks, books, users, likes } from '../db/schema/index.js';

export async function getCollectionById(id: string) {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.id, id),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  if (!collection) return null;

  return {
    ...collection,
  };
}

export async function getCollectionWithBooks(id: string, includePrivate: boolean = false, viewerId?: string) {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.id, id),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      collectionBooks: {
        with: {
          book: {
            columns: {
              id: true,
              title: true,
              coverImage: true,
              averageRating: true,
              pageCount: true,
            },
          },
        },
        orderBy: (cb, { asc }) => [asc(cb.orderIndex)],
      },
    },
  });

  if (!collection) return null;

  if (!collection.isPublic && (!viewerId || viewerId !== collection.userId)) {
    if (!includePrivate) return null;
  }

    const [likesCountResult, isLikedResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(likes)
      .where(and(eq(likes.likeableId, id), eq(likes.likeableType, 'collection'))),
    viewerId
      ? db.query.likes.findFirst({
          where: and(
            eq(likes.userId, viewerId),
            eq(likes.likeableId, id),
            eq(likes.likeableType, 'collection'),
          ),
        })
      : Promise.resolve(null),
  ]);

  return {
    ...collection,
    likesCount: Number(likesCountResult[0].value),
    isLiked: !!isLikedResult,
    books: collection.collectionBooks.map((cb) => ({
      id: cb.id,
      bookId: cb.bookId,
      orderIndex: cb.orderIndex,
      addedAt: cb.createdAt,
      book: cb.book,
    })),
  };
}

export async function getCollectionsByUser(userId: string, page: number, limit: number, includePrivate: boolean = false) {
  const offset = (page - 1) * limit;

  const conditions = [eq(collections.userId, userId)];
  if (!includePrivate) {
    conditions.push(eq(collections.isPublic, true));
  }

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.collections.findMany({
      where: and(...conditions),
      orderBy: [desc(collections.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(collections).where(and(...conditions)),
  ]);

  return { rows, total: Number(total) };
}

export async function listPublicCollections(opts: {
  page: number;
  limit: number;
  userId?: string;
  search?: string;
  sortBy?: 'created' | 'title';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, userId, search, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(collections.isPublic, true)];
  if (userId) conditions.push(eq(collections.userId, userId));

  let query = db.select({
    id: collections.id,
    userId: collections.userId,
    title: collections.title,
    description: collections.description,
    coverImage: collections.coverImage,
    isPublic: collections.isPublic,
    createdAt: collections.createdAt,
    user: {
      id: users.id,
      username: users.username,
      profilePicture: users.profilePicture,
    },
  }).from(collections)
    .innerJoin(users, eq(users.id, collections.userId))
    .$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const orderColumn = sortBy === 'title' ? collections.title : collections.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(collections).where(and(...conditions));

  return { rows, total: Number(total) };
}

export async function createCollection(userId: string, data: {
  title: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
}) {
  const [collection] = await db
    .insert(collections)
    .values({
      userId,
      title: data.title,
      description: data.description || null,
      coverImage: data.coverImage || null,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    })
    .returning();

  return collection;
}

export async function updateCollection(
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    coverImage?: string;
    isPublic?: boolean;
  },
) {
  const existing = await getCollectionById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Collection not found'), { code: 'NOT_FOUND' });
  }

  const [updated] = await db
    .update(collections)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(collections.id, id))
    .returning();

  return updated;
}

export async function deleteCollection(id: string, userId: string) {
  const existing = await getCollectionById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Collection not found'), { code: 'NOT_FOUND' });
  }

  await db.delete(collections).where(eq(collections.id, id));
}

export async function addBookToCollection(
  userId: string,
  collectionId: string,
  bookId: string,
) {
  const collection = await getCollectionById(collectionId);
  if (!collection || collection.userId !== userId) {
    throw Object.assign(new Error('Collection not found'), { code: 'NOT_FOUND' });
  }

  const existing = await db.query.collectionBooks.findFirst({
    where: and(
      eq(collectionBooks.collectionId, collectionId),
      eq(collectionBooks.bookId, bookId),
    ),
  });

  if (existing) {
    return existing;
  }

  const maxOrder = await db
    .select({ value: sql`MAX(${collectionBooks.orderIndex})` })
    .from(collectionBooks)
    .where(eq(collectionBooks.collectionId, collectionId));

  const orderIndex = (maxOrder[0]?.value || 0) + 1;

  const [result] = await db
    .insert(collectionBooks)
    .values({
      collectionId,
      bookId,
      orderIndex,
    })
    .returning();

  return result;
}

export async function removeBookFromCollection(
  userId: string,
  collectionId: string,
  bookId: string,
) {
  const collection = await getCollectionById(collectionId);
  if (!collection || collection.userId !== userId) {
    throw Object.assign(new Error('Collection not found'), { code: 'NOT_FOUND' });
  }

  await db
    .delete(collectionBooks)
    .where(and(
      eq(collectionBooks.collectionId, collectionId),
      eq(collectionBooks.bookId, bookId),
    ));
}

export async function reorderBooksInCollection(
  userId: string,
  collectionId: string,
  bookIds: string[],
) {
  const collection = await getCollectionById(collectionId);
  if (!collection || collection.userId !== userId) {
    throw Object.assign(new Error('Collection not found'), { code: 'NOT_FOUND' });
  }

    await db.transaction(async (tx) => {
    for (let i = 0; i < bookIds.length; i++) {
      await tx
        .update(collectionBooks)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(and(
          eq(collectionBooks.collectionId, collectionId),
          eq(collectionBooks.bookId, bookIds[i]),
        ));
    }
  });
}