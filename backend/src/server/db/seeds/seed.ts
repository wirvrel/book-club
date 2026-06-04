import { db } from '../index.js';
import { sql, eq, and } from 'drizzle-orm';
import { hashPassword } from '../../utils/hash.js';
import {
  users,
  authors,
  publishers,
  bookSeries,
  books,
  genres,
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
} from '../schema/index.js';

import { genresData } from './data/genres.js';
import { publishersData } from './data/publishers.js';
import { authorsData } from './data/authors.js';
import { bookSeriesData, booksData } from './data/books.js';
import { usersData } from './data/users.js';
import { ratingsData } from './data/ratings.js';
import { quotesData } from './data/quotes.js';
import { collectionsData } from './data/collections.js';
import { followsData } from './data/follows.js';

const keyMaps = {
  genres: new Map<string, string>(),
  publishers: new Map<string, string>(),
  authors: new Map<string, string>(),
  bookSeries: new Map<string, string>(),
  books: new Map<string, string>(),
  users: new Map<string, string>(),
  shelves: new Map<string, string>(),
  ratings: new Map<string, string>(),
  quotes: new Map<string, string>(),
  collections: new Map<string, string>(),
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomSubset<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

async function seed() {
  console.log('🌱 Starting seed with LOCAL STORAGE files...\n');

    console.log('🗑️  Clearing database...');
  try {
    await db.delete(collectionBooks);
    await db.delete(collections);
    await db.delete(viewHistories);
    await db.delete(favorites);
    await db.delete(comments);
    await db.delete(likes);
    await db.delete(quotes);
    await db.delete(ratings);
    await db.delete(userBooks);
    await db.delete(shelves);
    await db.delete(follows);
    await db.delete(userAuthors);
    await db.delete(bookGenres);
    await db.delete(bookPublishers);
    await db.delete(bookAuthors);
    await db.delete(books);
    await db.delete(bookSeries);
    await db.delete(genres);
    await db.delete(publishers);
    await db.delete(authors);
    await db.delete(users);
    console.log('✅ Database cleared\n');
  } catch (error) {
    console.log('⚠️  Database already empty or tables do not exist yet\n');
  }

    console.log('📚 Seeding genres...');
  const parentGenres = genresData.filter((g) => !g.parentKey);
  const childGenres = genresData.filter((g) => g.parentKey);

  for (const genre of parentGenres) {
    const [inserted] = await db
      .insert(genres)
      .values({
        name: genre.name,
        description: genre.description,
        parentId: null,
      })
      .returning();
    keyMaps.genres.set(genre.key, inserted.id);
  }

  for (const genre of childGenres) {
    const parentId = keyMaps.genres.get(genre.parentKey!);
    const [inserted] = await db
      .insert(genres)
      .values({
        name: genre.name,
        description: genre.description,
        parentId: parentId || null,
      })
      .returning();
    keyMaps.genres.set(genre.key, inserted.id);
  }
  console.log(`✅ Seeded ${genresData.length} genres\n`);

    console.log('🏢 Seeding publishers...');
  for (const publisher of publishersData) {
    const [inserted] = await db
      .insert(publishers)
      .values({
        name: publisher.name,
        description: publisher.description,
        website: publisher.website,
        country: publisher.country,
        foundedYear: publisher.foundedYear,
        contactEmail: publisher.contactEmail,
        phone: publisher.phone,
        logo: `/storage/publishers/${publisher.key}.png`,
      })
      .returning();
    keyMaps.publishers.set(publisher.key, inserted.id);
  }
  console.log(`✅ Seeded ${publishersData.length} publishers\n`);

    console.log('✍️  Seeding authors...');
  for (const author of authorsData) {
    const [inserted] = await db
      .insert(authors)
      .values({
        name: author.name,
        bio: author.bio,
        birthDate: author.birthDate,
        birthPlace: author.birthPlace,
        nationality: author.nationality,
        typeOfWork: author.typeOfWork as any,
        website: author.website || null,
        deathDate: author.deathDate || null,
        socialMediaLinks: author.socialMediaLinks,
        mediaImages: author.mediaImages,
        mediaVideos: author.mediaVideos,
        funFacts: author.funFacts,
        profilePicture: `/storage/authors/${author.key}.jpg`,
      })
      .returning();
    keyMaps.authors.set(author.key, inserted.id);
  }
  console.log(`✅ Seeded ${authorsData.length} authors\n`);

    console.log('📖 Seeding book series...');
  for (const series of bookSeriesData) {
    const [inserted] = await db
      .insert(bookSeries)
      .values({
        title: series.title,
        description: series.description,
        totalBooks: series.totalBooks,
        isCompleted: series.isCompleted,
      })
      .returning();
    keyMaps.bookSeries.set(series.key, inserted.id);
  }
  console.log(`✅ Seeded ${bookSeriesData.length} book series\n`);

    console.log('📕 Seeding books...');
  for (const book of booksData) {
    const seriesId = book.seriesKey ? keyMaps.bookSeries.get(book.seriesKey) : null;
    const [inserted] = await db
      .insert(books)
      .values({
        title: book.title,
        description: book.description,
        plot: book.plot,
        history: book.history,
        seriesId: seriesId || null,
        numberInSeries: book.numberInSeries,
        pageCount: book.pageCount,
        languages: book.languages,
        ageRestriction: book.ageRestriction as any,
        funFacts: book.funFacts,
        adaptations: book.adaptations,
        isBestseller: book.isBestseller,
        coverImage: `/storage/books/${book.key}.jpg`,
      })
      .returning();
    keyMaps.books.set(book.key, inserted.id);

    for (const authorKey of book.authorKeys) {
      const authorId = keyMaps.authors.get(authorKey);
      if (authorId) {
        await db.insert(bookAuthors).values({ bookId: inserted.id, authorId });
      }
    }

    const publisherId = keyMaps.publishers.get(book.publisherKey);
    if (publisherId) {
      await db.insert(bookPublishers).values({
        bookId: inserted.id,
        publisherId,
        publishedDate: book.publishedDate,
        isbn: book.isbn,
        price: book.price,
        coverType: book.coverType as any,
        edition: book.edition,
      });
    }

    for (const genreKey of book.genreKeys) {
      const genreId = keyMaps.genres.get(genreKey);
      if (genreId) {
        await db.insert(bookGenres).values({ bookId: inserted.id, genreId });
      }
    }
  }
  console.log(`✅ Seeded ${booksData.length} books\n`);

    console.log('👥 Seeding users...');
  for (const user of usersData) {
    const passwordHash = await hashPassword(user.password);
    const [inserted] = await db
      .insert(users)
      .values({
        username: user.username,
        email: user.email,
        passwordHash,
        role: user.role,
        bio: user.bio,
        isPublic: user.isPublic,
        birthday: user.birthday,
        gender: user.gender,
        location: user.location,
        profilePicture: `/storage/users/${user.key}.png`,
      })
      .returning();
    keyMaps.users.set(user.key, inserted.id);

    const defaultShelves = ['Хочу прочитати', 'Читаю зараз', 'Прочитано'];
    for (const shelfName of defaultShelves) {
      const [shelf] = await db
        .insert(shelves)
        .values({ userId: inserted.id, name: shelfName })
        .returning();
      keyMaps.shelves.set(`${user.key}_${shelfName}`, shelf.id);
    }
  }
  console.log(`✅ Seeded ${usersData.length} users\n`);

    console.log('🤝 Seeding follows...');
  for (const follow of followsData) {
    const followerId = keyMaps.users.get(follow.followerKey);
    const followedId = keyMaps.users.get(follow.followedKey);
    if (followerId && followedId) {
      await db.insert(follows).values({ followerId, followedId });
    }
  }
  console.log(`✅ Seeded ${followsData.length} follows\n`);

    console.log('📚 Seeding user_books...');
  const userKeys = usersData.map((u) => u.key);
  const bookKeys = booksData.map((b) => b.key);
  let userBooksCount = 0;

  for (const userKey of userKeys) {
    const userId = keyMaps.users.get(userKey);
    if (!userId) continue;

    const userBookKeys = randomSubset(bookKeys, randomInt(3, 5));
    for (const bookKey of userBookKeys) {
      const bookId = keyMaps.books.get(bookKey);
      if (!bookId) continue;

      const shelfNames = ['Хочу прочитати', 'Читаю зараз', 'Прочитано'];
      const shelfName = randomElement(shelfNames);
      const shelfId = keyMaps.shelves.get(`${userKey}_${shelfName}`);
      if (!shelfId) continue;

      await db.insert(userBooks).values({
        userId,
        bookId,
        shelfId,
        readingFormat: randomElement(['physical', 'ebook', 'audiobook', 'other']) as any,
        isPrivate: Math.random() < 0.1,
        startDate: shelfName !== 'Хочу прочитати' ? '2024-01-15' : null,
        readDate: shelfName === 'Прочитано' ? '2024-03-20' : null,
        progressPages: shelfName === 'Читаю зараз' ? randomInt(50, 200) : null,
      });
      userBooksCount++;
    }
  }
  console.log(`✅ Seeded ${userBooksCount} user_books\n`);

    console.log('⭐ Seeding ratings...');
  for (const rating of ratingsData) {
    const userId = keyMaps.users.get(rating.userKey);
    const bookId = keyMaps.books.get(rating.bookKey);
    if (userId && bookId) {
      const [inserted] = await db
        .insert(ratings)
        .values({
          userId,
          bookId,
          rating: rating.rating,
          review: rating.review,
        })
        .returning();
      keyMaps.ratings.set(`${rating.userKey}_${rating.bookKey}`, inserted.id);
    }
  }
  console.log(`✅ Seeded ${ratingsData.length} ratings\n`);

    console.log('💬 Seeding quotes...');
  for (const quote of quotesData) {
    const userId = keyMaps.users.get(quote.userKey);
    const bookId = keyMaps.books.get(quote.bookKey);
    if (userId && bookId) {
      const [inserted] = await db
        .insert(quotes)
        .values({
          userId,
          bookId,
          text: quote.text,
          pageNumber: quote.pageNumber,
          containsSpoilers: quote.containsSpoilers,
          isPublic: quote.isPublic,
        })
        .returning();
      keyMaps.quotes.set(`${quote.userKey}_${quote.bookKey}_${quote.pageNumber}`, inserted.id);
    }
  }
  console.log(`✅ Seeded ${quotesData.length} quotes\n`);

    console.log('❤️  Seeding likes...');
  const ratingIds = Array.from(keyMaps.ratings.values());
  const quoteIds = Array.from(keyMaps.quotes.values());
  let likesCount = 0;

  for (const userKey of userKeys) {
    const userId = keyMaps.users.get(userKey);
    if (!userId) continue;

    const likedRatings = randomSubset(ratingIds, randomInt(2, 4));
    for (const ratingId of likedRatings) {
      await db.insert(likes).values({ userId, likeableId: ratingId, likeableType: 'rating' });
      likesCount++;
    }

    const likedQuotes = randomSubset(quoteIds, randomInt(1, 3));
    for (const quoteId of likedQuotes) {
      await db.insert(likes).values({ userId, likeableId: quoteId, likeableType: 'quote' });
      likesCount++;
    }
  }
  console.log(`✅ Seeded ${likesCount} likes\n`);

    console.log('💭 Seeding comments...');
  const commentTexts = ['Повністю згоден!', 'Дякую за відгук.', 'Цікава думка.', 'Саме так!', 'А мені здалося інакше.', 'Чудовий аналіз!'];

  let commentsCount = 0;
  for (let i = 0; i < 25; i++) {
    const userId = keyMaps.users.get(randomElement(userKeys));
    const commentableId = Math.random() < 0.6 ? randomElement(ratingIds) : randomElement(quoteIds);
    const commentableType = Math.random() < 0.6 ? 'rating' : 'quote';

    if (userId && commentableId) {
      await db.insert(comments).values({ userId, commentableId, commentableType, content: randomElement(commentTexts) });
      commentsCount++;
    }
  }
  console.log(`✅ Seeded ${commentsCount} comments\n`);

    console.log('📂 Seeding collections...');
  const collectionImages = [
    '0bf022d2-0165-4d2c-b18b-c1e1bea3458a.jpg',
    'a822a67b-9a7f-498a-9a40-8e06d04d3a78.jpg',
    'e9e93338-bddc-47df-854b-4b56bf0c3e93.jpg',
    '107fbe77-098f-47c0-9364-303cf2cd7e92.jpg',
    'd2241b5d-17a1-4cb0-9f33-0c33512ecf8d.jpg'
  ];

  for (let i = 0; i < collectionsData.length; i++) {
    const collection = collectionsData[i];
    const userId = keyMaps.users.get(collection.userKey);
    if (!userId) continue;

    const [inserted] = await db
      .insert(collections)
      .values({
        userId,
        title: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
        coverImage: `/storage/collections/${collectionImages[i % collectionImages.length]}`,
      })
      .returning();
    keyMaps.collections.set(`${collection.userKey}_${collection.title}`, inserted.id);

    for (let j = 0; j < collection.bookKeys.length; j++) {
      const bookId = keyMaps.books.get(collection.bookKeys[j]);
      if (bookId) {
        await db.insert(collectionBooks).values({ collectionId: inserted.id, bookId, orderIndex: j });
      }
    }
  }
  console.log(`✅ Seeded ${collectionsData.length} collections\n`);

    console.log('✍️  Seeding user_authors (with duplicate check)...');
  const authorKeys = Array.from(keyMaps.authors.keys());
  let userAuthorsCount = 0;
  for (const userKey of userKeys.slice(0, 5)) {
    const userId = keyMaps.users.get(userKey);
    if (!userId) continue;

    const managedAuthors = randomSubset(authorKeys, randomInt(1, 2));
    for (const authorKey of managedAuthors) {
      const authorId = keyMaps.authors.get(authorKey);
      if (authorId) {
          const existing = await db.select().from(userAuthors).where(
          and(eq(userAuthors.userId, userId), eq(userAuthors.authorId, authorId))
        ).limit(1);

        if (existing.length === 0) {
          await db.insert(userAuthors).values({ userId, authorId });
          userAuthorsCount++;
        }
      }
    }
  }
  console.log(`✅ Seeded ${userAuthorsCount} user_authors\n`);

  console.log('🎉 Seed completed successfully!\n');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
