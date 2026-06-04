import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const genres = pgTable('genres', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  parentId: uuid('parent_id').references(() => genres.id, { onDelete: 'cascade' }),
  description: text('description'),
  bookCount: integer('book_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});