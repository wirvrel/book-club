import { useLoaderData, Link } from 'react-router-dom';
import { shelvesApi, useGetShelvesQuery } from '../features/shelves/shelvesApi';
import { getImageUrl } from '../utils/getImageUrl';
import { store } from '../app/store';
import styles from './Shelves.module.css';

export const shelvesLoader = async () => {
  const promise = store.dispatch(shelvesApi.endpoints.getShelves.initiate(undefined));
  
  try {
    await promise;
  } finally {
    promise.unsubscribe();
  }
  
  return null;
};

export const ShelvesPage = () => {
  const { data: shelves, isLoading } = useGetShelvesQuery(undefined);

  if (isLoading) return <div>Завантаження...</div>;

  const allShelves = shelves?.data || [];

  return (
    <div className={styles.container}>
      <h1>Мої полиці</h1>
      
      <div className={styles.shelvesGrid}>
        {allShelves.map((shelf: any) => (
          <section key={shelf.id} className={styles.shelfSection}>
            <div className={styles.shelfHeader}>
              <h2>{shelf.name}</h2>
              <span className={styles.count}>{shelf.books?.length || 0} книг</span>
            </div>
            
            <div className={styles.booksList}>
              {shelf.books?.length ? (
                shelf.books.map((entry: any) => (
                  <Link key={entry.book.id} to={`/books/${entry.book.id}`} className={styles.bookItem}>
                    <img src={getImageUrl(entry.book.coverImage, 'book')} alt={entry.book.title} className={styles.miniCover} />
                    <div className={styles.bookInfo}>
                      <h3>{entry.book.title}</h3>
                      {entry.progress !== undefined && entry.progress !== null && (
                        <div className={styles.progressWrapper}>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ width: `${Math.min(100, (entry.progress / (entry.book.pageCount || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className={styles.progressText}>{entry.progress} / {entry.book.pageCount} стор.</span>
                        </div>
                      )}
                      {entry.readingFormat && (
                        <span className={styles.formatTag}>{entry.readingFormat}</span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <p className={styles.empty}>На цій полиці поки порожньо.</p>
              )}
            </div>
          </section>
        ))}
        {!allShelves.length && (
          <p className={styles.noData}>У вас ще немає жодної полиці. Спробуйте увійти знову або зверніться в підтримку.</p>
        )}
      </div>
    </div>
  );
};
