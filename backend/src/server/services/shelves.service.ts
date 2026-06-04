import { eq, and, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { shelves, userBooks, books } from '../db/schema/index.js';

const DEFAULT_SHELF_NAMES = ['Хочу прочитати', 'Читаю зараз', 'Прочитано'] as const;
export type DefaultShelfName = (typeof DEFAULT_SHELF_NAMES)[number];
export type ShelfType = 'want_to_read' | 'currently_reading' | 'read';

export function isDefaultShelf(name: string): boolean {
  return DEFAULT_SHELF_NAMES.includes(name as DefaultShelfName);
}

export async function getShelvesByUserId(userId: string) {
  const shelvesData = await db.query.shelves.findMany({
    where: eq(shelves.userId, userId),
    with: {
      userBooks: {
        with: {
          book: {
            columns: {
              id: true,
              title: true,
              coverImage: true,
              pageCount: true,
            },
          },
        },
        limit: 10,
        orderBy: (ub, { desc }) => [desc(ub.createdAt)],
      },
    },
    orderBy: [asc(shelves.name)],
  });

  return shelvesData.map((s) => ({
    ...s,
    books: s.userBooks.map((ub) => ({
      book: ub.book,
      progress: ub.progressPages,
      rating: ub.rating,
      notes: ub.notes,
      startDate: ub.startDate,
      readDate: ub.readDate,
      readingFormat: ub.readingFormat,
    })),
  }));
}

export async function getShelfById(id: string, userId: string) {
  return db.query.shelves.findFirst({
    where: and(eq(shelves.id, id), eq(shelves.userId, userId)),
  });
}

export async function createShelf(userId: string, name: string) {
  const [shelf] = await db
    .insert(shelves)
    .values({
      userId,
      name,
    })
    .returning();
  return shelf;
}

export async function updateShelf(id: string, userId: string, name: string) {
  const [updated] = await db
    .update(shelves)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(shelves.id, id), eq(shelves.userId, userId)))
    .returning();
  return updated;
}

export async function deleteShelf(id: string, userId: string) {
  const result = await db
    .delete(shelves)
    .where(and(eq(shelves.id, id), eq(shelves.userId, userId)));
  return result;
}

export async function createDefaultShelves(userId: string) {
  const defaultShelves = [
    { name: 'Хочу прочитати' },
    { name: 'Читаю зараз' },
    { name: 'Прочитано' },
  ];

  const inserted = await db
    .insert(shelves)
    .values(defaultShelves.map((s) => ({ userId, name: s.name })))
    .returning();

  return inserted;
}

export async function addBookToShelf(
  userId: string,
  shelfId: string,
  bookId: string,
  data?: {
    readingFormat?: string;
    startDate?: string;
    readDate?: string;
    progressPages?: number;
    rating?: number;
    notes?: string;
    isPrivate?: boolean;
  },
) {
  const shelf = await getShelfById(shelfId, userId);
  if (!shelf) {
    throw Object.assign(new Error('Shelf not found'), { code: 'SHELF_NOT_FOUND' });
  }

  const [userBook] = await db
    .insert(userBooks)
    .values({
      userId,
      bookId,
      shelfId,
      readingFormat: (data?.readingFormat as any) || 'physical',
      startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : null,
      readDate: data?.readDate ? new Date(data.readDate).toISOString().split('T')[0] : null,
      progressPages: data?.progressPages || null,
      rating: data?.rating || null,
      notes: data?.notes || null,
      isPrivate: data?.isPrivate || false,
    })
    .onConflictDoUpdate({
      target: [userBooks.userId, userBooks.bookId, userBooks.shelfId],
      set: {
        ...data,
        startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : undefined,
        readDate: data?.readDate ? new Date(data.readDate).toISOString().split('T')[0] : undefined,
        updatedAt: new Date(),
      },
    })
    .returning();

  return userBook;
}

export async function removeBookFromShelf(userId: string, shelfId: string, bookId: string) {
  await db
    .delete(userBooks)
    .where(
      and(
        eq(userBooks.userId, userId),
        eq(userBooks.shelfId, shelfId),
        eq(userBooks.bookId, bookId),
      ),
    );
}

export async function updateBookProgress(
  userId: string,
  shelfId: string,
  bookId: string,
  data: {
    progressPages?: number;
    rating?: number;
    notes?: string;
    readDate?: string;
    readingFormat?: string;
    isPrivate?: boolean;
  },
) {
  const [updated] = await db
    .update(userBooks)
    .set({
      ...data,
      readDate: data.readDate ? new Date(data.readDate) : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userBooks.userId, userId),
        eq(userBooks.shelfId, shelfId),
        eq(userBooks.bookId, bookId),
      ),
    )
    .returning();

  return updated;
}

export async function getBooksOnShelf(
  userId: string,
  shelfId: string,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: userBooks.id,
        bookId: userBooks.bookId,
        shelfId: userBooks.shelfId,
        startDate: userBooks.startDate,
        readDate: userBooks.readDate,
        progressPages: userBooks.progressPages,
        rating: userBooks.rating,
        notes: userBooks.notes,
        readingFormat: userBooks.readingFormat,
        isPrivate: userBooks.isPrivate,
        book: {
          id: books.id,
          title: books.title,
          coverImage: books.coverImage,
          averageRating: books.averageRating,
          pageCount: books.pageCount,
        },
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(eq(userBooks.userId, userId), eq(userBooks.shelfId, shelfId)))
      .orderBy(desc(userBooks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.shelfId, shelfId))),
  ]);

  return { rows, total: Number(total) };
}

export async function moveBookToShelf(
  userId: string,
  bookId: string,
  fromShelfId: string,
  toShelfId: string,
) {
  const [updated] = await db
    .update(userBooks)
    .set({
      shelfId: toShelfId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userBooks.userId, userId),
        eq(userBooks.bookId, bookId),
        eq(userBooks.shelfId, fromShelfId),
      ),
    )
    .returning();

  return updated;
}