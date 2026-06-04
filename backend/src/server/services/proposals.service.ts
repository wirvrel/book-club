import { eq, and, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { proposals, users } from '../db/schema/index.js';
import { createBook } from './books.service.js';
import { createAuthor } from './authors.service.js';

export type ProposalType = 'book' | 'author';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export async function getProposalById(id: string) {
  return db.query.proposals.findFirst({
    where: eq(proposals.id, id),
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

export async function listProposals(opts: {
  page: number;
  limit: number;
  type?: ProposalType;
  status?: ProposalStatus;
  userId?: string;
  sortBy?: 'created';
  sortOrder?: 'asc' | 'desc';
}) {
  const { page, limit, type, status, userId, sortBy = 'created', sortOrder = 'desc' } = opts;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (type) conditions.push(eq(proposals.type, type));
  if (status) conditions.push(eq(proposals.status, status));
  if (userId) conditions.push(eq(proposals.userId, userId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let query = db.select({
    id: proposals.id,
    userId: proposals.userId,
    type: proposals.type,
    status: proposals.status,
    title: proposals.title,
    name: proposals.name,
    description: proposals.description,
    rejectionReason: proposals.rejectionReason,
    createdAt: proposals.createdAt,
    updatedAt: proposals.updatedAt,
    user: {
      id: users.id,
      username: users.username,
      profilePicture: users.profilePicture,
    },
  }).from(proposals)
    .innerJoin(users, eq(users.id, proposals.userId))
    .$dynamic();

  if (where) {
    query = query.where(where);
  }

  const orderColumn = proposals.createdAt;
  query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

  const rows = await query.limit(limit).offset(offset);

  const countQuery = db.select({ value: count() }).from(proposals);
  const [{ value: total }] = where
    ? await countQuery.where(where)
    : await countQuery;

  return { rows, total: Number(total) };
}

export async function getUserProposals(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.proposals.findMany({
      where: eq(proposals.userId, userId),
      orderBy: [desc(proposals.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(proposals).where(eq(proposals.userId, userId)),
  ]);

  return { rows, total: Number(total) };
}

export async function createProposal(userId: string, data: {
  type: ProposalType;
  title?: string;
  description?: string;
  coverImage?: string;
  pageCount?: number;
  isbn?: string;
  publishedDate?: string;
  name?: string;
  bio?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  typeOfWork?: string;
  profilePicture?: string;
}) {
  const [proposal] = await db
    .insert(proposals)
    .values({
      userId,
      type: data.type,
      status: 'pending',
      title: data.title || null,
      description: data.description || null,
      coverImage: data.coverImage || null,
      pageCount: data.pageCount || null,
      isbn: data.isbn || null,
      publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
      name: data.name || null,
      bio: data.bio || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      birthPlace: data.birthPlace || null,
      nationality: data.nationality || null,
      typeOfWork: data.typeOfWork || null,
      profilePicture: data.profilePicture || null,
    })
    .returning();

  return proposal;
}

export async function approveProposal(
  id: string,
  adminId: string,
  adminNotes?: string,
) {
  const existing = await getProposalById(id);

  if (!existing) {
    throw Object.assign(new Error('Proposal not found'), { code: 'NOT_FOUND' });
  }

  if (existing.status !== 'pending') {
    throw Object.assign(
      new Error('Proposal has already been processed'),
      { code: 'ALREADY_PROCESSED' },
    );
  }

    if (existing.type === 'book') {
    if (!existing.title) {
      throw Object.assign(
        new Error('Proposal is missing required book title'),
        { code: 'INVALID_PROPOSAL' },
      );
    }
    await createBook({
      title: existing.title,
      description: existing.description ?? undefined,
      coverImage: existing.coverImage ?? undefined,
      pageCount: existing.pageCount ?? undefined,
    });
  } else if (existing.type === 'author') {
    if (!existing.name) {
      throw Object.assign(
        new Error('Proposal is missing required author name'),
        { code: 'INVALID_PROPOSAL' },
      );
    }
    await createAuthor({
      name: existing.name,
      bio: existing.bio ?? undefined,
      birthPlace: existing.birthPlace ?? undefined,
      nationality: existing.nationality ?? undefined,
      typeOfWork: existing.typeOfWork ?? undefined,
      profilePicture: existing.profilePicture ?? undefined,
    });
  }

  const [updated] = await db
    .update(proposals)
    .set({
      status: 'approved',
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, id))
    .returning();

  return updated;
}

export async function rejectProposal(
  id: string,
  adminId: string,
  rejectionReason: string,
) {
  const existing = await getProposalById(id);

  if (!existing) {
    throw Object.assign(new Error('Proposal not found'), { code: 'NOT_FOUND' });
  }

  if (existing.status !== 'pending') {
    throw Object.assign(
      new Error('Proposal has already been processed'),
      { code: 'ALREADY_PROCESSED' },
    );
  }

  const [updated] = await db
    .update(proposals)
    .set({
      status: 'rejected',
      rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, id))
    .returning();

  return updated;
}

export async function deleteProposal(id: string, userId: string) {
  const existing = await getProposalById(id);
  if (!existing || existing.userId !== userId) {
    throw Object.assign(new Error('Proposal not found'), { code: 'NOT_FOUND' });
  }

  if (existing.status !== 'pending') {
    throw Object.assign(new Error('Cannot delete processed proposal'), { code: 'ALREADY_PROCESSED' });
  }

  await db.delete(proposals).where(eq(proposals.id, id));
}
