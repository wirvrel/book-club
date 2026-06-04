import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const publishers = pgTable('publishers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  country: varchar('country', { length: 50 }),
  foundedYear: integer('founded_year'),
  logo: varchar('logo', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});