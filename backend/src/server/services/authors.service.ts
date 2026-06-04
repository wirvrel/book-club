import { eq, and, count, avg, ilike, asc, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { authors, bookAuthors, books } from '../db/schema/index.js';

export async function getAuthorById(id: string) {
  const author = await db.query.authors.findFirst({
    where: eq(authors.id, id),
    columns: {
      id: true,
      name: true,
      bio: true,
      birthDate: true,
      deathDate: true,
      birthPlace: true,
      nationality: true,
      typeOfWork: true,
      profilePicture: true,
      website: true,
      funFacts: true,
      createdAt: true,
    },
    with: {
      bookAuthors: {
          limit: 10,
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

  if (!author) return null;

    const bookCount = await db
    .select({ value: count() })
    .from(bookAuthors)
    .where(eq(bookAuthors.authorId, id));

  const avgRating = author.bookAuthors.length
    ? await db
        .select({ value: avg(books.averageRating) })
        .from(books)
        .innerJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
        .where(eq(bookAuthors.authorId, id))
    : null;

  return {
    ...author,
    books: author.bookAuthors.map((ba) => ba.book),
    stats: {
      bookCount: Number(bookCount[0].value),
      averageRating: avgRating ? Number(Number(avgRating[0].value).toFixed(2)) : 0,
    },
  };
}

export async function listAuthors(opts: {
  page: number;
  limit: number;
  search?: string;
  typeOfWork?: string;
  sortBy?: 'name' | 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, search, typeOfWork, sortBy = 'name', sortOrder = 'asc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(ilike(authors.name, `%${search}%`));
  }

  if (typeOfWork) {
    conditions.push(eq(authors.typeOfWork, typeOfWork));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db
    .select({
      id: authors.id,
      name: authors.name,
      bio: authors.bio,
      birthDate: authors.birthDate,
      deathDate: authors.deathDate,
      birthPlace: authors.birthPlace,
      nationality: authors.nationality,
      typeOfWork: authors.typeOfWork,
      profilePicture: authors.profilePicture,
      website: authors.website,
      funFacts: authors.funFacts,
      createdAt: authors.createdAt,
    })
    .from(authors)
    .$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn = sortBy === 'name' ? authors.name : authors.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQ = db.select({ value: count() }).from(authors);
  const [{ value: total }] = where ? await countQ.where(where) : await countQ;

  return { rows, total: Number(total) };
}

export async function createAuthor(data: {
  name: string;
  bio?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  typeOfWork?: string;
  website?: string;
  profilePicture?: string;
  deathDate?: string;
  socialMediaLinks?: Record<string, string>;
  mediaImages?: string[];
  mediaVideos?: string[];
  funFacts?: string[];
}) {
  const [author] = await db
    .insert(authors)
    .values({
      ...data,
      socialMediaLinks: data.socialMediaLinks ? JSON.stringify(data.socialMediaLinks) : null,
      mediaImages: data.mediaImages ? JSON.stringify(data.mediaImages) : null,
      mediaVideos: data.mediaVideos ? JSON.stringify(data.mediaVideos) : null,
      funFacts: data.funFacts ? JSON.stringify(data.funFacts) : null,
    })
    .returning();

  return author;
}

export async function updateAuthor(
  id: string,
  data: Partial<{
    name: string;
    bio: string;
    birthDate: string;
    birthPlace: string;
    nationality: string;
    typeOfWork: string;
    website: string;
    profilePicture: string;
    deathDate: string;
    socialMediaLinks: Record<string, string>;
    mediaImages: string[];
    mediaVideos: string[];
    funFacts: string[];
  }>,
) {
  const updateData: any = { ...data, updatedAt: new Date() };

  if (data.socialMediaLinks) {
    updateData.socialMediaLinks = JSON.stringify(data.socialMediaLinks);
  }
  if (data.mediaImages) {
    updateData.mediaImages = JSON.stringify(data.mediaImages);
  }
  if (data.mediaVideos) {
    updateData.mediaVideos = JSON.stringify(data.mediaVideos);
  }
  if (data.funFacts) {
    updateData.funFacts = JSON.stringify(data.funFacts);
  }

  const [updated] = await db.update(authors).set(updateData).where(eq(authors.id, id)).returning();

  return updated;
}

export async function deleteAuthor(id: string) {
  await db.delete(authors).where(eq(authors.id, id));
}

export async function getAuthorBooks(authorId: string, page: number, limit: number) {
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
      .from(bookAuthors)
      .innerJoin(books, eq(books.id, bookAuthors.bookId))
      .where(eq(bookAuthors.authorId, authorId))
      .orderBy(desc(books.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(bookAuthors).where(eq(bookAuthors.authorId, authorId)),
  ]);

  return { rows, total: Number(total) };
}
