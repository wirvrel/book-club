import { useParams, Link } from 'react-router-dom';
import { useGetAuthorByIdQuery, useGetAuthorBooksQuery, authorsApi } from '../features/authors/authorsApi';
import { getImageUrl } from '../utils/getImageUrl';
import { store } from '../app/store';
import styles from './AuthorDetails.module.css';

export const authorDetailsLoader = async ({ params }: { params: any }) => {
  const { id } = params;
  const authorPromise = store.dispatch(authorsApi.endpoints.getAuthorById.initiate(id));
  const booksPromise = store.dispatch(authorsApi.endpoints.getAuthorBooks.initiate({ id, limit: 20 }));
  
  try {
    await Promise.all([authorPromise, booksPromise]);
  } finally {
    authorPromise.unsubscribe();
    booksPromise.unsubscribe();
  }
  
  return { id };
};

export const AuthorDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: authorData } = useGetAuthorByIdQuery(id!);
  const { data: booksData } = useGetAuthorBooksQuery({ id: id!, limit: 20 });

  const author = authorData?.data;

  if (!author) return <div>Автора не знайдено</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.photoWrapper}>
          <img src={getImageUrl(author.profilePicture, 'author')} alt={author.name} className={styles.photo} />
        </div>
        <div className={styles.mainInfo}>
          <h1 className={styles.name}>{author.name}</h1>
          <div className={styles.meta}>
            {author.birthDate && <span>Народився: {new Date(author.birthDate).toLocaleDateString('uk-UA')}</span>}
            {author.nationality && <span className={styles.badge}>{author.nationality}</span>}
          </div>
          <p className={styles.bio}>{author.bio || 'Біографія відсутня.'}</p>
        </div>
      </header>

      <section className={styles.booksSection}>
        <h2>Книги автора</h2>
        <div className={styles.booksGrid}>
          {booksData?.data?.map((book: any) => (
            <Link key={book.id} to={`/books/${book.id}`} className={styles.bookCard}>
              <img src={getImageUrl(book.coverImage, 'book')} alt={book.title} className={styles.bookCover} />
              <h3>{book.title}</h3>
              <div className={styles.bookMeta}>
                <span>★ {book.averageRating || '—'}</span>
                <span>{book.publishedYear}</span>
              </div>
            </Link>
          ))}
          {!booksData?.data?.length && <p>Книг цього автора поки немає в нашій базі.</p>}
        </div>
      </section>
    </div>
  );
};
