import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { books } from './books.js';
import { authors } from './authors.js';
import { publishers } from './publishers.js';
import { genres } from './genres.js';
import { bookSeries } from './bookSeries.js';
import { proposals } from './proposals.js';
import {
  bookAuthors,
  bookPublishers,
  bookGenres,
  userAuthors,
  follows,
  shelves,
  userBooks,
  ratings,
  quotes,
  likes,
  comments,
  favorites,
  viewHistories,
  collections,
  collectionBooks,
} from './relations.js';

export const usersRelations = relations(users, ({ many }) => ({
  followers: many(follows, { relationName: 'followers' }),
  following: many(follows, { relationName: 'following' }),
  shelves: many(shelves),
  userBooks: many(userBooks),
  ratings: many(ratings),
  quotes: many(quotes),
  comments: many(comments),
  likes: many(likes),
  favorites: many(favorites),
  viewHistories: many(viewHistories),
  collections: many(collections),
  managedAuthors: many(userAuthors),
  proposals: many(proposals),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  series: one(bookSeries, {
    fields: [books.seriesId],
    references: [bookSeries.id],
  }),
  bookAuthors: many(bookAuthors),
  bookPublishers: many(bookPublishers),
  bookGenres: many(bookGenres),
  userBooks: many(userBooks),
  ratings: many(ratings),
  quotes: many(quotes),
  collectionBooks: many(collectionBooks),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
  userAuthors: many(userAuthors),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  bookPublishers: many(bookPublishers),
}));

export const genresRelations = relations(genres, ({ one, many }) => ({
  parent: one(genres, {
    fields: [genres.parentId],
    references: [genres.id],
    relationName: 'genreHierarchy',
  }),
  children: many(genres, { relationName: 'genreHierarchy' }),
  bookGenres: many(bookGenres),
}));

export const bookSeriesRelations = relations(bookSeries, ({ many }) => ({
  books: many(books),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id],
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id],
  }),
}));

export const bookPublishersRelations = relations(bookPublishers, ({ one }) => ({
  book: one(books, {
    fields: [bookPublishers.bookId],
    references: [books.id],
  }),
  publisher: one(publishers, {
    fields: [bookPublishers.publisherId],
    references: [publishers.id],
  }),
}));

export const bookGenresRelations = relations(bookGenres, ({ one }) => ({
  book: one(books, {
    fields: [bookGenres.bookId],
    references: [books.id],
  }),
  genre: one(genres, {
    fields: [bookGenres.genreId],
    references: [genres.id],
  }),
}));

export const userAuthorsRelations = relations(userAuthors, ({ one }) => ({
  user: one(users, {
    fields: [userAuthors.userId],
    references: [users.id],
  }),
  author: one(authors, {
    fields: [userAuthors.authorId],
    references: [authors.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'followers',
  }),
  followed: one(users, {
    fields: [follows.followedId],
    references: [users.id],
    relationName: 'following',
  }),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  user: one(users, {
    fields: [shelves.userId],
    references: [users.id],
  }),
  userBooks: many(userBooks),
}));

export const userBooksRelations = relations(userBooks, ({ one }) => ({
  user: one(users, {
    fields: [userBooks.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [userBooks.bookId],
    references: [books.id],
  }),
  shelf: one(shelves, {
    fields: [userBooks.shelfId],
    references: [shelves.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [ratings.bookId],
    references: [books.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [quotes.bookId],
    references: [books.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const viewHistoriesRelations = relations(viewHistories, ({ one }) => ({
  user: one(users, {
    fields: [viewHistories.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  collectionBooks: many(collectionBooks),
}));

export const collectionBooksRelations = relations(collectionBooks, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionBooks.collectionId],
    references: [collections.id],
  }),
  book: one(books, {
    fields: [collectionBooks.bookId],
    references: [books.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
}));
