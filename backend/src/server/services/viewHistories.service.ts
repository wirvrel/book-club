import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { viewHistories } from '../db/schema/index.js';

export type ViewableType = 'book' | 'author' | 'collection';

export async function recordView(
  userId: string,
  viewableId: string,
  viewableType: ViewableType,
) {
  const existing = await db.query.viewHistories.findFirst({
    where: and(
      eq(viewHistories.userId, userId),
      eq(viewHistories.viewableId, viewableId),
      eq(viewHistories.viewableType, viewableType),
    ),
  });

  if (existing) {
      const [updated] = await db
      .update(viewHistories)
      .set({ updatedAt: new Date() })
      .where(eq(viewHistories.id, existing.id))
      .returning();
    return updated;
  }

  const [view] = await db
    .insert(viewHistories)
    .values({ userId, viewableId, viewableType })
    .returning();

  return view;
}

export async function getViewHistory(
  userId: string,
  viewableType: ViewableType | undefined,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  const conditions = [eq(viewHistories.userId, userId)];
  if (viewableType) {
    conditions.push(eq(viewHistories.viewableType, viewableType));
  }

  const where = and(...conditions);

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.viewHistories.findMany({
      where,
      orderBy: (vh, { desc }) => [desc(vh.updatedAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(viewHistories).where(where),
  ]);

  return { rows, total: Number(total) };
}

export async function clearViewHistory(
  userId: string,
  viewableType?: ViewableType,
) {
  const conditions = [eq(viewHistories.userId, userId)];
  if (viewableType) {
    conditions.push(eq(viewHistories.viewableType, viewableType));
  }

  await db.delete(viewHistories).where(and(...conditions));
}
