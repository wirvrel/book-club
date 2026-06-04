import { Link } from 'react-router-dom';
import { useGetBooksQuery, booksApi } from '../features/books/booksApi';
import { useGetAuthorsQuery, authorsApi } from '../features/authors/authorsApi';
import { useGetFeedQuery, feedApi } from '../features/feed/feedApi';
import { useGetMeQuery } from '../features/auth/authApi';
import { FeedItem } from '../features/feed/FeedItem';
import { getImageUrl } from '../utils/getImageUrl';
import { BookOpen } from 'lucide-react';
import { store } from '../app/store';
import styles from './Home.module.css';

export const homeLoader = async () => {
  const token = localStorage.getItem('accessToken');
  
  const promises: any[] = [
    store.dispatch(booksApi.endpoints.getBooks.initiate({ limit: 4, sortBy: 'rating', sortOrder: 'desc' })),
    store.dispatch(authorsApi.endpoints.getAuthors.initiate({ limit: 4 }))
  ];

  if (token) {
    promises.push(store.dispatch(feedApi.endpoints.getFeed.initiate({ limit: 10 })));
  }
  
  try {
    await Promise.all(promises);
  } finally {
    promises.forEach(p => p.unsubscribe?.());
  }
  
  return null;
};

export const HomePage = () => {
  const { data: myData } = useGetMeQuery(undefined);
  const { data: popularBooks } = useGetBooksQuery({ limit: 4, sortBy: 'rating', sortOrder: 'desc' });
  const { data: featuredAuthors } = useGetAuthorsQuery({ limit: 4 });
  const { data: feedData, isLoading: isFeedLoading } = useGetFeedQuery({ limit: 10 }, { skip: !myData });

  const isLoggedIn = !!myData;

  if (isLoggedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.feedLayout}>
          <main className={styles.mainFeed}>
            <header className={styles.feedHeader}>
               <h1>Для вас, {myData.data.username}</h1>
               <p>Свіжі новини від людей, на яких ви підписані.</p>
            </header>
            
            <section className={styles.feedList}>
              {isFeedLoading ? (
                <p>Оновлюємо стрічку...</p>
              ) : feedData?.data?.length ? (
                feedData.data.map((item: any) => (
                  <FeedItem key={item.id} item={item} currentUserId={myData.data.id} />
                ))
              ) : (
                <div className={styles.emptyFeed}>
                  <p>Ваша стрічка поки порожня. Підпишіться на активних читачів, щоб бачити їхні відгуки!</p>
                  <Link to="/search" className={styles.primaryBtn}>Знайти друзів</Link>
                </div>
              )}
            </section>
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.sideSection}>
              <h3>🔥 Популярне зараз</h3>
              <div className={styles.sideBookList}>
                {popularBooks?.data?.map((book: any) => (
                  <Link key={book.id} to={`/books/${book.id}`} className={styles.sideBook}>
                    <img src={getImageUrl(book.coverImage, 'book')} alt="" />
                    <div className={styles.sideBookInfo}>
                      <h4>{book.title}</h4>
                      <p>★ {Number(book.averageRating || 0).toFixed(1)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/books" className={styles.sideLink}>Всі новинки →</Link>
            </div>

            <div className={styles.sideSection}>
              <h3>✨ Рекомендовані автори</h3>
              <div className={styles.sideAuthorList}>
                {featuredAuthors?.data?.map((author: any) => (
                  <Link key={author.id} to={`/authors/${author.id}`} className={styles.sideAuthor}>
                    <img src={getImageUrl(author.profilePicture, 'author')} alt="" />
                    <span>{author.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Відкрий свою наступну улюблену книгу</h1>
          <p>Приєднуйся до тисяч книголюбів та веди свою бібліотеку.</p>
          <div className={styles.heroActions}>
            <Link to="/books" className={styles.primaryBtn}>Каталог</Link>
            <Link to="/register" className={styles.secondaryBtn}>Приєднатися</Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <BookOpen strokeWidth={1} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Популярні книги</h2>
          <Link to="/books">Всі книги →</Link>
        </div>
        <div className={styles.grid}>
          {popularBooks?.data?.map((book: any) => (
            <Link key={book.id} to={`/books/${book.id}`} className={styles.card}>
              <img src={getImageUrl(book.coverImage, 'book')} alt={book.title} />
              <h3>{book.title}</h3>
              <p>★ {Number(book.averageRating || 0).toFixed(1)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Відомі автори</h2>
          <Link to="/authors">Всі автори →</Link>
        </div>
        <div className={styles.authorsRow}>
          {featuredAuthors?.data?.map((author: any) => (
            <Link key={author.id} to={`/authors/${author.id}`} className={styles.authorCard}>
              <div className={styles.avatar}>
                <img src={getImageUrl(author.profilePicture, 'author')} alt={author.name} />
              </div>
              <h3>{author.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
