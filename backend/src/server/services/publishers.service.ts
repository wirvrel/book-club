import { eq, and, count, ilike, asc, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { publishers, bookPublishers, books } from '../db/schema/index.js';

export async function getPublisherById(id: string) {
  const publisher = await db.query.publishers.findFirst({
    where: eq(publishers.id, id),
    with: {
      bookPublishers: {
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
      },
    },
  });

  if (!publisher) return null;

  return {
    ...publisher,
    books: publisher.bookPublishers.map((bp) => ({
      ...bp.book,
      publishedDate: bp.publishedDate,
      isbn: bp.isbn,
    })),
  };
}

export async function listPublishers(opts: {
  page: number;
  limit: number;
  search?: string;
  country?: string;
  sortBy?: 'name' | 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, search, country, sortBy = 'name', sortOrder = 'asc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(ilike(publishers.name, `%${search}%`));
  }

  if (country) {
    conditions.push(eq(publishers.country, country));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select({
      id: publishers.id,
      name: publishers.name,
      description: publishers.description,
      website: publishers.website,
      country: publishers.country,
      foundedYear: publishers.foundedYear,
      logo: publishers.logo,
      createdAt: publishers.createdAt,
    })
    .from(publishers)
    .$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn = sortBy === 'name' ? publishers.name : publishers.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(publishers);
  const [{ value: total }] = where ? await countQ.where(where) : await countQ;

  return { rows, total: Number(total) };
}

export async function createPublisher(data: {
  name: string;
  description?: string;
  website?: string;
  country?: string;
  foundedYear?: number;
  logo?: string;
  contactEmail?: string;
  phone?: string;
}) {
  const [publisher] = await db.insert(publishers).values(data).returning();
  return publisher;
}

export async function updatePublisher(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    website: string;
    country: string;
    foundedYear: number;
    logo: string;
    contactEmail: string;
    phone: string;
  }>,
) {
  const [updated] = await db
    .update(publishers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(publishers.id, id))
    .returning();

  return updated;
}

export async function deletePublisher(id: string) {
  await db.delete(publishers).where(eq(publishers.id, id));
}

export async function getPublisherBooks(publisherId: string, page: number, limit: number) {
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
        publishedDate: bookPublishers.publishedDate,
        isbn: bookPublishers.isbn,
        createdAt: books.createdAt,
      })
      .from(bookPublishers)
      .innerJoin(books, eq(books.id, bookPublishers.bookId))
      .where(eq(bookPublishers.publisherId, publisherId))
      .orderBy(desc(bookPublishers.publishedDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(bookPublishers)
      .where(eq(bookPublishers.publisherId, publisherId)),
  ]);

  return { rows, total: Number(total) };
}
