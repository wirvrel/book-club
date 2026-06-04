import { eq, and, count, ilike, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { books, bookAuthors, bookGenres, bookPublishers, authors, genres, publishers, ratings } from '../db/schema/index.js';

export async function getBookById(id: string) {
  const book = await db.query.books.findFirst({
    where: eq(books.id, id),
    with: {
      bookAuthors: {
        with: {
          author: true,
        },
      },
      bookGenres: {
        with: {
          genre: true,
        },
      },
      bookPublishers: {
        with: {
          publisher: true,
        },
      },
      series: true,
    },
  });

  if (!book) return null;

  const ratingsCountResult = await db
    .select({ value: count() })
    .from(ratings)
    .where(eq(ratings.bookId, id));

  return {
    ...book,
    ratingsCount: Number(ratingsCountResult[0].value),
    authors: book.bookAuthors.map((ba) => ba.author),
    genres: book.bookGenres.map((bg) => bg.genre),
    publishers: book.bookPublishers.map((bp) => ({
      ...bp.publisher,
      publishedDate: bp.publishedDate,
      isbn: bp.isbn,
      format: bp.format,
      coverType: bp.coverType,
    })),
  };
}

export async function listBooks(opts: {
  page: number;
  limit: number;
  search?: string;
    genreIds?: string[];
  authorIds?: string[];
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  languages?: string[];
  ageRestriction?: string;
  isBestseller?: boolean;
  sortBy?: 'rating' | 'title' | 'year' | 'reviews' | 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    page,
    limit,
    search,
    genreIds,
    authorIds,
    minRating,
    maxRating,
    minYear,
    maxYear,
    languages,
    ageRestriction,
    isBestseller,
    sortBy = 'created',
    sortOrder = 'desc',
  } = opts;

  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
      const bookIdsForAuthor = db
      .select({ id: bookAuthors.bookId })
      .from(bookAuthors)
      .innerJoin(authors, eq(authors.id, bookAuthors.authorId))
      .where(ilike(authors.name, `%${search}%`));

    const bookIdsForIsbn = db
      .select({ id: bookPublishers.bookId })
      .from(bookPublishers)
      .where(ilike(bookPublishers.isbn, `%${search}%`));

    conditions.push(
      sql`(
        ${ilike(books.title, `%${search}%`)}
        OR ${books.id} IN ${bookIdsForAuthor}
        OR ${books.id} IN ${bookIdsForIsbn}
      )`,
    );
  }

  if (minRating !== undefined) {
    conditions.push(sql`${books.averageRating} >= ${minRating}`);
  }

  if (maxRating !== undefined) {
    conditions.push(sql`${books.averageRating} <= ${maxRating}`);
  }

  if (ageRestriction) {
    conditions.push(eq(books.ageRestriction, ageRestriction));
  }

  if (isBestseller !== undefined) {
    conditions.push(eq(books.isBestseller, isBestseller));
  }

    if (genreIds && genreIds.length > 0) {
    const bookIdsWithGenres = db
      .select({ bookId: bookGenres.bookId })
      .from(bookGenres)
      .where(inArray(bookGenres.genreId, genreIds))
      .groupBy(bookGenres.bookId)
      .having(sql`COUNT(DISTINCT ${bookGenres.genreId}) >= 1`);
    conditions.push(inArray(books.id, bookIdsWithGenres));
  }

    if (authorIds && authorIds.length > 0) {
    const bookIdsWithAuthors = db
      .select({ bookId: bookAuthors.bookId })
      .from(bookAuthors)
      .where(inArray(bookAuthors.authorId, authorIds));
    conditions.push(inArray(books.id, bookIdsWithAuthors));
  }

    if (minYear !== undefined) {
    const bookIdsMinYear = db
      .select({ bookId: bookPublishers.bookId })
      .from(bookPublishers)
      .where(sql`EXTRACT(YEAR FROM ${bookPublishers.publishedDate}) >= ${minYear}`);
    conditions.push(inArray(books.id, bookIdsMinYear));
  }

  if (maxYear !== undefined) {
    const bookIdsMaxYear = db
      .select({ bookId: bookPublishers.bookId })
      .from(bookPublishers)
      .where(sql`EXTRACT(YEAR FROM ${bookPublishers.publishedDate}) <= ${maxYear}`);
    conditions.push(inArray(books.id, bookIdsMaxYear));
  }

    if (languages && languages.length > 0) {
    const langConditions = languages.map(
      (lang) => sql`${books.languages}::jsonb @> ${JSON.stringify([lang])}::jsonb`,
    );
    conditions.push(sql`(${sql.join(langConditions, sql` OR `)})`);
  }

  let query = db
    .select({
      id: books.id,
      title: books.title,
      description: books.description,
      coverImage: books.coverImage,
      averageRating: books.averageRating,
      pageCount: books.pageCount,
      languages: books.languages,
      ageRestriction: books.ageRestriction,
      isBestseller: books.isBestseller,
      createdAt: books.createdAt,
    })
    .from(books)
    .$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

    let orderExpr;
  if (sortBy === 'rating') {
    orderExpr = books.averageRating;
  } else if (sortBy === 'title') {
    orderExpr = books.title;
  } else if (sortBy === 'year') {
      orderExpr = books.createdAt;
  } else if (sortBy === 'reviews') {
      const ratingCountSubq = sql<number>`(
      SELECT COUNT(*) FROM ratings r WHERE r.book_id = ${books.id}
    )`;
    query = query.orderBy(sortOrder === 'asc' ? asc(ratingCountSubq) : desc(ratingCountSubq));
    const rows = await query.limit(limit).offset(offset);
    const countQ = db.select({ value: count() }).from(books);
    const [{ value: total }] = conditions.length > 0 ? await countQ.where(and(...conditions)) : await countQ;
    return { rows: await enrichBooksWithAuthorsAndGenres(rows), total: Number(total) };
  } else {
    orderExpr = books.createdAt;
  }

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(books);
  const [{ value: total }] = conditions.length > 0 ? await countQ.where(and(...conditions)) : await countQ;

  return { rows: await enrichBooksWithAuthorsAndGenres(rows), total: Number(total) };
}


export async function enrichBooksWithAuthorsAndGenres<T extends { id: string }>(rows: T[]) {
  if (rows.length === 0) return rows;

  const bookIds = rows.map((b) => b.id);

  const [authorsData, genresData, publishersData] = await Promise.all([
    db
      .select({
        bookId: bookAuthors.bookId,
        authorId: authors.id,
        authorName: authors.name,
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(authors.id, bookAuthors.authorId))
      .where(inArray(bookAuthors.bookId, bookIds)),
    db
      .select({
        bookId: bookGenres.bookId,
        genreId: genres.id,
        genreName: genres.name,
      })
      .from(bookGenres)
      .innerJoin(genres, eq(genres.id, bookGenres.genreId))
      .where(inArray(bookGenres.bookId, bookIds)),
    db
      .select({
        bookId: bookPublishers.bookId,
        publishedDate: bookPublishers.publishedDate,
      })
      .from(bookPublishers)
      .where(inArray(bookPublishers.bookId, bookIds)),
  ]);

    const authorsByBook = new Map<string, { id: string; name: string }[]>();
  for (const a of authorsData) {
    if (!authorsByBook.has(a.bookId)) authorsByBook.set(a.bookId, []);
    authorsByBook.get(a.bookId)!.push({ id: a.authorId, name: a.authorName });
  }

  const genresByBook = new Map<string, { id: string; name: string }[]>();
  for (const g of genresData) {
    if (!genresByBook.has(g.bookId)) genresByBook.set(g.bookId, []);
    genresByBook.get(g.bookId)!.push({ id: g.genreId, name: g.genreName });
  }

  const yearByBook = new Map<string, number | null>();
  for (const p of publishersData) {
    if (p.publishedDate) {
      const year = new Date(p.publishedDate).getFullYear();
        const existing = yearByBook.get(p.bookId);
      if (existing === undefined || (year < (existing ?? 9999))) {
        yearByBook.set(p.bookId, year);
      }
    }
  }

  return rows.map((book) => ({
    ...book,
    authors: authorsByBook.get(book.id) ?? [],
    genres: (genresByBook.get(book.id) ?? []).slice(0, 3),
    publishedYear: yearByBook.get(book.id) ?? null,
  }));
}

export async function createBook(data: {
  title: string;
  description?: string;
  plot?: string;
  history?: string;
  seriesId?: string;
  numberInSeries?: number;
  pageCount?: number;
  languages?: string[];
  ageRestriction?: string;
  coverImage?: string;
  funFacts?: string[];
  adaptations?: string[];
  isBestseller?: boolean;
  authorIds?: string[];
  genreIds?: string[];
}) {
  const { authorIds, genreIds, ...bookData } = data;

  const [book] = await db
    .insert(books)
    .values({
      ...bookData,
      languages: bookData.languages ? JSON.stringify(bookData.languages) : null,
      funFacts: bookData.funFacts ? JSON.stringify(bookData.funFacts) : null,
      adaptations: bookData.adaptations ? JSON.stringify(bookData.adaptations) : null,
    })
    .returning();

    if (authorIds && authorIds.length > 0) {
    await db.insert(bookAuthors).values(
      authorIds.map((authorId) => ({
        bookId: book.id,
        authorId,
      })),
    );
  }

    if (genreIds && genreIds.length > 0) {
    await db.insert(bookGenres).values(
      genreIds.map((genreId) => ({
        bookId: book.id,
        genreId,
      })),
    );
  }

  return book;
}

export async function updateBook(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    plot: string;
    history: string;
    seriesId: string;
    numberInSeries: number;
    pageCount: number;
    languages: string[];
    ageRestriction: string;
    coverImage: string;
    funFacts: string[];
    adaptations: string[];
    isBestseller: boolean;
    authorIds: string[];
    genreIds: string[];
  }>,
) {
  const { authorIds, genreIds, ...bookData } = data;

  const updateData: any = { ...bookData, updatedAt: new Date() };

  if (bookData.languages) {
    updateData.languages = JSON.stringify(bookData.languages);
  }
  if (bookData.funFacts) {
    updateData.funFacts = JSON.stringify(bookData.funFacts);
  }
  if (bookData.adaptations) {
    updateData.adaptations = JSON.stringify(bookData.adaptations);
  }

  const [updated] = await db.update(books).set(updateData).where(eq(books.id, id)).returning();

    if (authorIds) {
    await db.delete(bookAuthors).where(eq(bookAuthors.bookId, id));
    if (authorIds.length > 0) {
      await db.insert(bookAuthors).values(
        authorIds.map((authorId) => ({
          bookId: id,
          authorId,
        })),
      );
    }
  }

    if (genreIds) {
    await db.delete(bookGenres).where(eq(bookGenres.bookId, id));
    if (genreIds.length > 0) {
      await db.insert(bookGenres).values(
        genreIds.map((genreId) => ({
          bookId: id,
          genreId,
        })),
      );
    }
  }

  return updated;
}

export async function deleteBook(id: string) {
  await db.delete(books).where(eq(books.id, id));
}

export async function getBookRatings(bookId: string, page: number, limit: number) {
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
      limit,
      offset,
      orderBy: [desc(ratings.createdAt)],
    }),
    db.select({ value: count() }).from(ratings).where(eq(ratings.bookId, bookId)),
  ]);

  return { rows, total: Number(total) };
}
