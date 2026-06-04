import { eq, and, count, ilike, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, follows, shelves, ratings, quotes, collections } from '../db/schema/index.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

export async function getUserById(id: string, currentUserId?: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return null;

  const [followerCountResult, followingCountResult] = await Promise.all([
    db.select({ value: count() }).from(follows).where(eq(follows.followedId, id)),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, id)),
  ]);

  let isFollowing = false;
  if (currentUserId && currentUserId !== id) {
    const following = await db.query.follows.findFirst({
      where: and(eq(follows.followerId, currentUserId), eq(follows.followedId, id)),
    });
    isFollowing = !!following;
  }

  return {
    ...user,
    followerCount: Number(followerCountResult[0].value),
    followingCount: Number(followingCountResult[0].value),
    isFollowing,
  };
}

export async function listUsers(opts: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(users.isPublic, true)];
  if (search) {
    conditions.push(ilike(users.username, `%${search}%`));
  }
  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        isPublic: users.isPublic,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(asc(users.username))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(users).where(where),
  ]);

  return { rows, total: Number(total) };
}

export async function updateUser(
  id: string,
  data: Partial<{
    username: string;
    bio: string;
    profilePicture: string;
    birthday: string;
    gender: string;
    location: string;
    socialMediaLinks: unknown;
    isPublic: boolean;
  }>,
) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

    if (!user.passwordHash) {
    throw Object.assign(
      new Error('This account uses Google OAuth and has no password. Use Google to sign in.'),
      { code: 'OAUTH_ACCOUNT' },
    );
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Wrong password'), { code: 'WRONG_PASSWORD' });

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function followUser(followerId: string, followedId: string) {
  if (followerId === followedId) {
    throw Object.assign(new Error('Cannot follow yourself'), { code: 'SELF_FOLLOW' });
  }
  await db
    .insert(follows)
    .values({ followerId, followedId })
    .onConflictDoNothing();
}

export async function unfollowUser(followerId: string, followedId: string) {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followedId, followedId)));
}

export async function getFollowers(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followerId))
      .where(eq(follows.followedId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(follows).where(eq(follows.followedId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getFollowing(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(users.id, follows.followedId))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getUserShelves(userId: string) {
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
      },
    },
  });

  return shelvesData.map((s) => ({
    id: s.id,
    name: s.name,
    books: s.userBooks.map((ub) => ({
      book: ub.book,
      progress: ub.progressPages,
    })),
  }));
}

export async function getUserRatings(
  userId: string,
  page: number,
  limit: number,
  isOwner: boolean,
) {
  const offset = (page - 1) * limit;
    return db.query.ratings.findMany({
    where: eq(ratings.userId, userId),
    limit,
    offset,
    with: { book: { columns: { id: true, title: true, coverImage: true, averageRating: true } } },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

export async function getUserQuotes(
  userId: string,
  page: number,
  limit: number,
  isOwner: boolean,
) {
  const offset = (page - 1) * limit;
    const where = isOwner
    ? eq(quotes.userId, userId)
    : and(eq(quotes.userId, userId), eq(quotes.isPublic, true));

  return db.query.quotes.findMany({
    where,
    limit,
    offset,
    with: { book: { columns: { id: true, title: true } } },
    orderBy: (q, { desc }) => [desc(q.createdAt)],
  });
}

export async function getUserCollections(
  userId: string,
  page: number,
  limit: number,
  isOwner: boolean,
) {
  const offset = (page - 1) * limit;
    const where = isOwner
    ? eq(collections.userId, userId)
    : and(eq(collections.userId, userId), eq(collections.isPublic, true));

  return db.query.collections.findMany({
    where,
    limit,
    offset,
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}
