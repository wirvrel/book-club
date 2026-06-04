import { eq, and, count, desc, asc, sql, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import { quotes, books, users } from '../db/schema/index.js';

export async function getQuoteById(id: string) {
  return db.query.quotes.findFirst({
    where: eq(quotes.id, id),
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

export async function getQuotesByBook(bookId: string, page: number, limit: number, includeSpoilers: boolean = false) {
  const offset = (page - 1) * limit;

  const conditions = [eq(quotes.bookId, bookId)];
  if (!includeSpoilers) {
    conditions.push(eq(quotes.containsSpoilers, false));
  }

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.quotes.findMany({
      where: and(...conditions),
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
      orderBy: [desc(quotes.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(quotes).where(and(...conditions)),
  ]);

  return { rows, total: Number(total) };
}

export async function getQuotesByUser(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.quotes.findMany({
      where: eq(quotes.userId, userId),
      with: {
        book: {
          columns: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
      orderBy: [desc(quotes.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(quotes).where(eq(quotes.userId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function listQuotes(opts: {
  page: number;
  limit: number;
  bookId?: string;
  userId?: string;
  search?: string;
  includeSpoilers?: boolean;
  isPublic?: boolean;
  sortBy?: 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, bookId, userId, search, includeSpoilers = false, isPublic, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (bookId) conditions.push(eq(quotes.bookId, bookId));
  if (userId) conditions.push(eq(quotes.userId, userId));
  if (search) conditions.push(ilike(quotes.text, `%${search}%`));
  if (!includeSpoilers) conditions.push(eq(quotes.containsSpoilers, false));
  if (isPublic !== undefined) conditions.push(eq(quotes.isPublic, isPublic));

  let query = db.select({
    id: quotes.id,
    userId: quotes.userId,
    bookId: quotes.bookId,
    text: quotes.text,
    pageNumber: quotes.pageNumber,
    containsSpoilers: quotes.containsSpoilers,
    isPublic: quotes.isPublic,
    createdAt: quotes.createdAt,
    updatedAt: quotes.updatedAt,
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
  }).from(quotes)
    .innerJoin(users, eq(users.id, quotes.userId))
    .innerJoin(books, eq(books.id, quotes.bookId))
    .$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const orderColumn = sortBy === 'created' ? quotes.createdAt : quotes.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

    const countQuery = db.select({ value: count() }).from(quotes);
  const [{ value: total }] = conditions.length > 0
    ? await countQuery.where(and(...conditions))
    : await countQuery;

  return { rows, total: Number(total) };
}

export async function createQuote(userId: string, data: {
  bookId: string;
  text: string;
  pageNumber?: number;
  containsSpoilers?: boolean;
  isPublic?: boolean;
}) {
  const [quote] = await db
    .insert(quotes)
    .values({
      userId,
      bookId: data.bookId,
      text: data.text,
      pageNumber: data.pageNumber || null,
      containsSpoilers: data.containsSpoilers || false,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    })
    .returning();

  return quote;
}

export async function updateQuote(
  id: string,
  userId: string,
  data: {
    text?: string;
    pageNumber?: number;
    containsSpoilers?: boolean;
    isPublic?: boolean;
  },
) {
  const existing = await getQuoteById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Quote not found'), { code: 'NOT_FOUND' });
  }

  const [updated] = await db
    .update(quotes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id))
    .returning();

  return updated;
}

export async function deleteQuote(id: string, userId: string) {
  const existing = await getQuoteById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Quote not found'), { code: 'NOT_FOUND' });
  }

  await db.delete(quotes).where(eq(quotes.id, id));
}
