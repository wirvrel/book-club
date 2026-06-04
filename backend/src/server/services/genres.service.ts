import { eq, and, count, ilike, asc, desc, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { genres, bookGenres, books } from '../db/schema/index.js';

export async function getGenreById(id: string) {
  const genre = await db.query.genres.findFirst({
    where: eq(genres.id, id),
    with: {
      parent: true,
      children: true,
      bookGenres: {
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
      },
    },
  });

  if (!genre) return null;

  return {
    ...genre,
    books: genre.bookGenres.map((bg) => bg.book),
  };
}

export async function listGenres(opts: {
  page: number;
  limit: number;
  search?: string;
  parentId?: string | null;
  sortBy?: 'name' | 'bookCount' | 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, search, parentId, sortBy = 'name', sortOrder = 'asc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(ilike(genres.name, `%${search}%`));
  }

  if (parentId === null) {
    conditions.push(isNull(genres.parentId));
  } else if (parentId) {
    conditions.push(eq(genres.parentId, parentId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select({
      id: genres.id,
      name: genres.name,
      description: genres.description,
      parentId: genres.parentId,
      bookCount: genres.bookCount,
      createdAt: genres.createdAt,
    })
    .from(genres)
    .$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn =
    sortBy === 'name'
      ? genres.name
      : sortBy === 'bookCount'
        ? genres.bookCount
        : genres.createdAt;

  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(genres);
  const [{ value: total }] = where ? await countQ.where(where) : await countQ;

  return { rows, total: Number(total) };
}

export async function createGenre(data: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  const [genre] = await db.insert(genres).values(data).returning();
  return genre;
}

export async function updateGenre(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    parentId: string;
  }>,
) {
  const [updated] = await db
    .update(genres)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(genres.id, id))
    .returning();

  return updated;
}

export async function deleteGenre(id: string) {
  await db.delete(genres).where(eq(genres.id, id));
}

export async function getGenreBooks(genreId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        coverImage: books.coverImage,
        averageRating: books.averageRating,
        pageCount: books.pageCount,
        createdAt: books.createdAt,
      })
      .from(bookGenres)
      .innerJoin(books, eq(books.id, bookGenres.bookId))
      .where(eq(bookGenres.genreId, genreId))
      .orderBy(desc(books.averageRating))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(bookGenres).where(eq(bookGenres.genreId, genreId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getGenreHierarchy() {
  const allGenres = await db.query.genres.findMany({
    with: {
      children: true,
    },
    orderBy: [asc(genres.name)],
  });

    const rootGenres = allGenres.filter((g) => !g.parentId);

  return rootGenres;
}
