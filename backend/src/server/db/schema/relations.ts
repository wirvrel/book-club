import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { books } from './books.js';
import { authors } from './authors.js';
import { publishers } from './publishers.js';
import { genres } from './genres.js';

export const readingFormatEnum = pgEnum('reading_format', [
  'physical',
  'ebook',
  'audiobook',
  'other',
]);

export const coverTypeEnum = pgEnum('cover_type', ['hardcover', 'paperback', 'other']);

export const bookAuthors = pgTable(
  'book_authors',
  {
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.authorId] })],
);

export const bookPublishers = pgTable(
  'book_publishers',
  {
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    publisherId: uuid('publisher_id')
      .notNull()
      .references(() => publishers.id, { onDelete: 'cascade' }),
    publishedDate: date('published_date'),
    isbn: varchar('isbn', { length: 13 }).unique(),
    circulation: integer('circulation'),
    format: varchar('format', { length: 50 }),
    coverType: coverTypeEnum('cover_type'),
    translator: varchar('translator', { length: 100 }),
    edition: integer('edition'),
    price: integer('price'),
      binding: varchar('binding', { length: 50 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.publisherId] })],
);

export const bookGenres = pgTable(
  'book_genres',
  {
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.genreId] })],
);

export const userAuthors = pgTable(
  'user_authors',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.authorId] })],
);

export const follows = pgTable(
  'follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followedId: uuid('followed_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followedId] })],
);

export const shelves = pgTable('shelves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userBooks = pgTable(
  'user_books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    shelfId: uuid('shelf_id')
      .notNull()
      .references(() => shelves.id, { onDelete: 'cascade' }),
    startDate: date('start_date'),
    readDate: date('read_date'),
    progressPages: integer('progress_pages'),
    isPrivate: boolean('is_private').default(false),
    rating: integer('rating'),
    notes: text('notes'),
    readingFormat: readingFormatEnum('reading_format'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.bookId, t.shelfId)],
);

export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    review: text('review'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.bookId)],
);

export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  pageNumber: integer('page_number'),
  containsSpoilers: boolean('contains_spoilers').default(false),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    likeableId: uuid('likeable_id').notNull(),
    likeableType: varchar('likeable_type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.likeableId, t.likeableType)],
);

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  commentableId: uuid('commentable_id').notNull(),
  commentableType: varchar('commentable_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references((): any => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    favoriteableId: uuid('favoriteable_id').notNull(),
    favoriteableType: varchar('favoriteable_type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.favoriteableId, t.favoriteableType)],
);

export const viewHistories = pgTable(
  'view_histories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewableId: uuid('viewable_id').notNull(),
    viewableType: varchar('viewable_type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.viewableId, t.viewableType)],
);

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 255 }),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const collectionBooks = pgTable(
  'collection_books',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.bookId] })],
);
