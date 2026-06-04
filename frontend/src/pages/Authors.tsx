import { useLoaderData, Link } from 'react-router-dom';
import { authorsApi, useGetAuthorsQuery } from '../features/authors/authorsApi';
import { getImageUrl } from '../utils/getImageUrl';
import styles from './Authors.module.css';
import { store } from '../app/store';

export const authorsLoader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '30';
  
  const promise = store.dispatch(
    authorsApi.endpoints.getAuthors.initiate({ page: parseInt(page), limit: parseInt(limit) })
  );
  
  try {
    await promise;
  } finally {
    promise.unsubscribe();
  }
  
  return { page: parseInt(page), limit: parseInt(limit) };
};

export const AuthorsPage = () => {
  const { page, limit } = useLoaderData() as { page: number; limit: number };
  const { data, isLoading } = useGetAuthorsQuery({ page, limit });

  if (isLoading) return <div>Завантаження...</div>;

  return (
    <div className={styles.container}>
      <h1>Автори</h1>
      <div className={styles.grid}>
        {data?.data?.map((author: any) => (
          <Link key={author.id} to={`/authors/${author.id}`} className={styles.card}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>
                <img 
                  src={getImageUrl(author.profilePicture, 'author')} 
                  alt={author.name} 
                />
              </div>
              <h3>{author.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
