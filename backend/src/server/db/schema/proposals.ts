import { pgTable, uuid, varchar, text, date, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending'),
    title: varchar('title', { length: 255 }),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 255 }),
    pageCount: integer('page_count'),
  isbn: varchar('isbn', { length: 13 }),
  publishedDate: date('published_date'),
    name: varchar('name', { length: 100 }),
  bio: text('bio'),
  birthDate: date('birth_date'),
  birthPlace: varchar('birth_place', { length: 100 }),
  nationality: varchar('nationality', { length: 50 }),
  typeOfWork: varchar('type_of_work', { length: 50 }),
  profilePicture: varchar('profile_picture', { length: 255 }),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
