import { pgTable, uuid, varchar, text, boolean, date, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  profilePicture: text('profile_picture'),
  bio: text('bio'),
  isPublic: boolean('is_public').default(true),
  birthday: date('birthday'),
  gender: varchar('gender', { length: 20 }),
  location: varchar('location', { length: 100 }),
  lastLogin: timestamp('last_login'),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  socialMediaLinks: jsonb('social_media_links'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
