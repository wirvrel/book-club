import { eq, and, count, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { comments, users } from '../db/schema/index.js';

export type CommentableType = 'rating' | 'quote';

export async function getCommentById(id: string) {
  return db.query.comments.findFirst({
    where: eq(comments.id, id),
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

export async function getCommentsByItem(
  itemId: string,
  itemType: CommentableType,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  let query = db
    .select({
      id: comments.id,
      userId: comments.userId,
      commentableId: comments.commentableId,
      commentableType: comments.commentableType,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      user: {
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
      },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(
      and(
        eq(comments.commentableId, itemId),
        eq(comments.commentableType, itemType),
      ),
    )
    .$dynamic();

  query = query
    .orderBy(asc(comments.createdAt))
    .limit(limit)
    .offset(offset);

  const [rows, [{ value: total }]] = await Promise.all([
    query,
    db
      .select({ value: count() })
      .from(comments)
      .where(
        and(
          eq(comments.commentableId, itemId),
          eq(comments.commentableType, itemType),
        ),
      ),
  ]);

  const { value: totalCount } = total;

  return { rows, total: Number(totalCount) };
}

export async function getReplies(commentId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.comments.findMany({
      where: eq(comments.parentId, commentId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [asc(comments.createdAt)],
      limit,
      offset,
    }),
    db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.parentId, commentId)),
  ]);

  return { rows, total: Number(total) };
}

export async function getCommentsByUser(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.comments.findMany({
      where: eq(comments.userId, userId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [desc(comments.createdAt)],
      limit,
      offset,
    }),
    db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.userId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function createComment(userId: string, data: {
  commentableId: string;
  commentableType: CommentableType;
  content: string;
  parentId?: string;
}) {
  if (data.parentId) {
    const parent = await getCommentById(data.parentId);
    if (!parent) {
      throw Object.assign(new Error('Parent comment not found'), { code: 'PARENT_NOT_FOUND' });
    }

    const depth = await getCommentDepth(data.parentId);
    if (depth >= 2) {
      throw Object.assign(new Error('Maximum reply depth is 2'), { code: 'MAX_DEPTH' });
    }
  }

  const [comment] = await db
    .insert(comments)
    .values({
      userId,
      commentableId: data.commentableId,
      commentableType: data.commentableType,
      content: data.content,
      parentId: data.parentId || null,
    })
    .returning();

  return comment;
}

export async function updateComment(
  id: string,
  userId: string,
  content: string,
) {
  const existing = await getCommentById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Comment not found'), { code: 'NOT_FOUND' });
  }

  const [updated] = await db
    .update(comments)
    .set({
      content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id))
    .returning();

  return updated;
}

export async function deleteComment(id: string, userId: string) {
  const existing = await getCommentById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Comment not found'), { code: 'NOT_FOUND' });
  }

  await db.delete(comments).where(eq(comments.id, id));
}

async function getCommentDepth(commentId: string): Promise<number> {
  let depth = 0;
  let currentId: string | null = commentId;

  while (currentId) {
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, currentId),
      columns: { parentId: true },
    });

    if (comment?.parentId) {
      depth++;
      currentId = comment.parentId;
    } else {
      break;
    }
  }

  return depth;
}