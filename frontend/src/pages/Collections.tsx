import { Link } from 'react-router-dom';
import { useGetCollectionsQuery } from '../features/collections/collectionsApi';
import { getImageUrl } from '../utils/getImageUrl';
import styles from './Collections.module.css';

export const collectionsLoader = async () => {
  return null;
};

export const CollectionsPage = () => {
  const { data: collections, isLoading } = useGetCollectionsQuery({ limit: 20 });

  if (isLoading) return <div>Завантаження підбірок...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Книжкові підбірки</h1>
        <p>Відкривайте нові книги через кураторські списки нашої спільноти.</p>
      </header>

      <div className={styles.grid}>
        {collections?.data?.map((collection: any) => (
          <Link key={collection.id} to={`/collections/${collection.id}`} className={styles.card}>
            <div className={styles.coverWrapper}>
               <img src={getImageUrl(collection.coverImage, 'book')} alt="" className={styles.cover} />
            </div>
            <div className={styles.info}>
              <h3>{collection.title}</h3>
              <p className={styles.description}>{collection.description}</p>
              <div className={styles.meta}>
                <span>Створив: {collection.user?.username || 'Користувач'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
