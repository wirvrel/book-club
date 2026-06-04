import { useLoaderData, Form, Link } from 'react-router-dom';
import { usersApi, useGetUsersQuery } from '../features/users/usersApi';
import { store } from '../app/store';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Search as SearchIcon } from 'lucide-react';
import styles from './Search.module.css';

export const searchLoader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  
  if (q) {
    const promise = store.dispatch(usersApi.endpoints.getUsers.initiate({ search: q }));
    try {
      await promise;
    } finally {
      promise.unsubscribe();
    }
  }
  
  return { q };
};

export const SearchPage = () => {
  const { q } = useLoaderData() as { q: string };
  const { data: usersData, isLoading } = useGetUsersQuery({ search: q }, { skip: !q });

  return (
    <div className={styles.container}>
      <h1>Пошук книголюбів</h1>
      
      <Form className={styles.searchForm}>
        <TextField 
          name="q" 
          defaultValue={q} 
          placeholder="Введіть ім'я користувача..."
          className={styles.searchInput}
        />
        <Button type="submit">
          <SearchIcon size={20} />
        </Button>
      </Form>

      <div className={styles.results}>
        {isLoading ? (
          <p>Пошук...</p>
        ) : usersData?.data?.length ? (
          <div className={styles.usersGrid}>
            {usersData.data.map((user: any) => (
              <Link key={user.id} to={`/users/${user.id}`} className={styles.userCard}>
                <div className={styles.avatar}>
                  {user.profilePicture ? <img src={user.profilePicture} alt="" /> : user.username[0]}
                </div>
                <div className={styles.userInfo}>
                  <h3>{user.username}</h3>
                  <p>{user.bio || 'Без біографії'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : q ? (
          <p className={styles.empty}>Користувачів не знайдено за запитом "{q}"</p>
        ) : (
          <p className={styles.empty}>Знайдіть друзів, щоб стежити за їхніми оновленнями.</p>
        )}
      </div>
    </div>
  );
};
