import { eq, inArray, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { follows, ratings, quotes, collections, users, books } from '../db/schema/index.js';

export type FeedItemType = 'rating' | 'quote' | 'collection';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  data: Record<string, unknown>;
}

async function getFollowedUserIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ followedId: follows.followedId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  return rows.map((r) => r.followedId);
}

export async function getFeed(
  userId: string,
  page: number,
  limit: number,
  type?: FeedItemType,
): Promise<{ items: FeedItem[]; total: number }> {
  const followedIds = await getFollowedUserIds(userId);

    if (followedIds.length === 0) {
    return { items: [], total: 0 };
  }

  const offset = (page - 1) * limit;

    const fetchRatings = (!type || type === 'rating')
    ? db
        .select({
          id: ratings.id,
          type: sql<FeedItemType>`'rating'`.as('type'),
          createdAt: ratings.createdAt,
          userId: ratings.userId,
          username: users.username,
          profilePicture: users.profilePicture,
            bookId: ratings.bookId,
          rating: ratings.rating,
          review: ratings.review,
        })
        .from(ratings)
        .innerJoin(users, eq(users.id, ratings.userId))
        .where(inArray(ratings.userId, followedIds))
        .orderBy(desc(ratings.createdAt))
        .limit(type === 'rating' ? limit + offset : 200)
        : Promise.resolve([]);

  const fetchQuotes = (!type || type === 'quote')
    ? db
        .select({
          id: quotes.id,
          type: sql<FeedItemType>`'quote'`.as('type'),
          createdAt: quotes.createdAt,
          userId: quotes.userId,
          username: users.username,
          profilePicture: users.profilePicture,
          bookId: quotes.bookId,
          text: quotes.text,
          containsSpoilers: quotes.containsSpoilers,
          isPublic: quotes.isPublic,
        })
        .from(quotes)
        .innerJoin(users, eq(users.id, quotes.userId))
        .where(inArray(quotes.userId, followedIds))
        .orderBy(desc(quotes.createdAt))
        .limit(type === 'quote' ? limit + offset : 200)
    : Promise.resolve([]);

  const fetchCollections = (!type || type === 'collection')
    ? db
        .select({
          id: collections.id,
          type: sql<FeedItemType>`'collection'`.as('type'),
          createdAt: collections.createdAt,
          userId: collections.userId,
          username: users.username,
          profilePicture: users.profilePicture,
          title: collections.title,
          description: collections.description,
          coverImage: collections.coverImage,
          isPublic: collections.isPublic,
        })
        .from(collections)
        .innerJoin(users, eq(users.id, collections.userId))
        .where(inArray(collections.userId, followedIds))
        .orderBy(desc(collections.createdAt))
        .limit(type === 'collection' ? limit + offset : 200)
    : Promise.resolve([]);

  const [ratingsRows, quotesRows, collectionsRows] = await Promise.all([
    fetchRatings,
    fetchQuotes,
    fetchCollections,
  ]);

    const allItems: FeedItem[] = [
    ...(Array.isArray(ratingsRows) ? ratingsRows : []).map((r) => ({
      id: r.id,
      type: 'rating' as FeedItemType,
      createdAt: r.createdAt,
      user: { id: r.userId, username: r.username, profilePicture: r.profilePicture },
      data: {
        id: r.id,
        bookId: r.bookId,
        rating: r.rating,
        review: r.review,
      },
    })),
    ...(Array.isArray(quotesRows) ? quotesRows : []).map((q) => ({
      id: q.id,
      type: 'quote' as FeedItemType,
      createdAt: q.createdAt,
      user: { id: q.userId, username: q.username, profilePicture: q.profilePicture },
      data: {
        id: q.id,
        bookId: q.bookId,
        text: q.text,
        containsSpoilers: q.containsSpoilers,
        isPublic: q.isPublic,
      },
    })),
    ...(Array.isArray(collectionsRows) ? collectionsRows : []).map((c) => ({
      id: c.id,
      type: 'collection' as FeedItemType,
      createdAt: c.createdAt,
      user: { id: c.userId, username: c.username, profilePicture: c.profilePicture },
      data: {
        id: c.id,
        title: c.title,
        description: c.description,
        coverImage: c.coverImage,
        isPublic: c.isPublic,
      },
    })),
  ];

    const bookIds = Array.from(new Set(
    allItems
      .filter(item => item.type === 'rating' || item.type === 'quote')
      .map(item => item.data.bookId as string)
  ));

  if (bookIds.length > 0) {
    const booksData = await db
      .select({
        id: books.id,
        title: books.title,
        coverImage: books.coverImage,
      })
      .from(books)
      .where(inArray(books.id, bookIds));

    const booksMap = new Map(booksData.map(b => [b.id, b]));

    for (const item of allItems) {
      if ((item.type === 'rating' || item.type === 'quote') && item.data.bookId) {
        item.data.book = booksMap.get(item.data.bookId as string);
      }
    }
  }


    const filteredItems = allItems.filter((item) => {
    if (item.type === 'quote') return item.data.isPublic !== false;
    if (item.type === 'collection') return item.data.isPublic !== false;
    return true;
  });

    filteredItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = filteredItems.length;
  const items = filteredItems.slice(offset, offset + limit);

  return { items, total };
}
