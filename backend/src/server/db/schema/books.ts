import { pgTable, uuid, varchar, text, integer, decimal, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { bookSeries } from './bookSeries.js';

export const ageRatingEnum = pgEnum('age_rating', ['0+', '6+', '12+', '16+', '18+']);

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  plot: text('plot'),
  history: text('history'),
  seriesId: uuid('series_id').references(() => bookSeries.id, { onDelete: 'set null' }),
  numberInSeries: integer('number_in_series'),
  pageCount: integer('page_count'),
  languages: jsonb('languages'),
  ageRestriction: ageRatingEnum('age_restriction'),
  coverImage: text('cover_image'),
  funFacts: jsonb('fun_facts'),
  adaptations: jsonb('adaptations'),
  isBestseller: boolean('is_bestseller'),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});