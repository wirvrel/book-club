import { eq, and, count, sql, desc, asc, ilike } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, books, ratings, quotes, collections, proposals } from '../db/schema/index.js';
import { enrichBooksWithAuthorsAndGenres } from './books.service.js';

export interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  totalRatings: number;
  totalQuotes: number;
  totalCollections: number;
  pendingProposals: number;
  activeUsersThisMonth: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    usersResult,
    booksResult,
    ratingsResult,
    quotesResult,
    collectionsResult,
    proposalsResult,
    activeUsers,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(books),
    db.select({ value: count() }).from(ratings),
    db.select({ value: count() }).from(quotes),
    db.select({ value: count() }).from(collections),
    db.select({ value: count() }).from(proposals).where(eq(proposals.status, 'pending')),
    db
      .select({ value: count() })
      .from(users)
      .where(sql`${users.lastLogin} >= NOW() - INTERVAL '30 days'`),
  ]);

  return {
    totalUsers: Number(usersResult[0].value),
    totalBooks: Number(booksResult[0].value),
    totalRatings: Number(ratingsResult[0].value),
    totalQuotes: Number(quotesResult[0].value),
    totalCollections: Number(collectionsResult[0].value),
    pendingProposals: Number(proposalsResult[0].value),
    activeUsersThisMonth: Number(activeUsers[0].value),
  };
}

export async function getRecentProposals(limit: number = 10) {
  return db.query.proposals.findMany({
    where: eq(proposals.status, 'pending'),
    orderBy: [desc(proposals.createdAt)],
    limit,
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
}

export async function getRecentRatings(limit: number = 10) {
  return db.query.ratings.findMany({
    orderBy: [desc(ratings.createdAt)],
    limit,
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

export async function updateUserRole(userId: string, role: string) {
  const [updated] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

export async function banUser(userId: string, banned: boolean) {
  const [updated] = await db
    .update(users)
    .set({ role: banned ? 'banned' : 'user', updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

export async function deleteUserAccount(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function getAllUsers(opts: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  sortBy?: 'created' | 'username';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, search, role, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(ilike(users.username, `%${search}%`));
  }

  if (role) {
    conditions.push(eq(users.role, role));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    isPublic: users.isPublic,
    createdAt: users.createdAt,
    lastLogin: users.lastLogin,
  }).from(users).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn = sortBy === 'username' ? users.username : users.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(users);
  const [{ value: total }] = where ? await countQ.where(where) : await countQ;

  return { rows, total: Number(total) };
}

export async function getAllBooks(opts: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: 'created' | 'title' | 'rating';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, search, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(books.title, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select({
    id: books.id,
    title: books.title,
    coverImage: books.coverImage,
    averageRating: books.averageRating,
    isBestseller: books.isBestseller,
    createdAt: books.createdAt,
  }).from(books).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn =
    sortBy === 'title' ? books.title :
    sortBy === 'rating' ? books.averageRating :
    books.createdAt;

  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(books);
  const [{ value: total }] = where ? await countQ.where(where) : await countQ;

  return { rows: await enrichBooksWithAuthorsAndGenres(rows), total: Number(total) };
}

export async function deleteBookById(bookId: string) {
  await db.delete(books).where(eq(books.id, bookId));
}