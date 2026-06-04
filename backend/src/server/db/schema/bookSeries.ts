import { pgTable, uuid, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const bookSeries = pgTable('book_series', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  totalBooks: integer('total_books').default(0),
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});