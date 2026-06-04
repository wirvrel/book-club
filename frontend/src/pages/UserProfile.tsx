import { useLoaderData, Link, useNavigate } from 'react-router-dom';
import { useGetMeQuery } from '../features/auth/authApi';
import { 
  useGetUserByIdQuery, 
  useGetUserShelvesQuery, 
  useFollowUserMutation, 
  useUnfollowUserMutation,
  useGetUserRatingsQuery,
  useGetUserQuotesQuery
} from '../features/users/usersApi';
import { 
  useGetMyCollectionsQuery, 
  useGetUserCollectionsQuery,
  useCreateCollectionMutation 
} from '../features/collections/collectionsApi';
import { useGetMyProposalsQuery } from '../features/proposals/proposalsApi';
import { getImageUrl } from '../utils/getImageUrl';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { Modal, Dialog } from '../components/ui/Modal';
import { DialogTrigger, Form } from 'react-aria-components';
import { Plus, LayoutGrid, Library, History, CheckCircle, Clock, XCircle, BookOpen, User, Star, Quote as QuoteIcon } from 'lucide-react';
import { useState } from 'react';
import styles from './UserProfile.module.css';
import clsx from 'clsx';

export const userProfileLoader = async ({ params }: { params: any }) => {
  return { id: params.id || null };
};

export const UserProfilePage = () => {
  const { id } = useLoaderData() as { id: string | null };
  const navigate = useNavigate();
  const { data: myData } = useGetMeQuery(undefined, { skip: !!id });
  const { data: externalUserData, isLoading: isExternalLoading } = useGetUserByIdQuery(id!, { skip: !id });
  
  const userId = id || myData?.data?.id;
  const isMe = !id || id === myData?.data?.id;

  const { data: shelvesData } = useGetUserShelvesQuery(userId, { skip: !userId });
  const { data: collectionsData } = useGetUserCollectionsQuery(userId, { skip: !userId || !id });
  const { data: myCollectionsData } = useGetMyCollectionsQuery(undefined, { skip: !isMe });
  const { data: proposalsData } = useGetMyProposalsQuery(undefined, { skip: !isMe });
  
  const { data: ratingsData } = useGetUserRatingsQuery(userId, { skip: !userId });
  const { data: quotesData } = useGetUserQuotesQuery(userId, { skip: !userId });

  const [createCollection, { isLoading: isCreatingColl }] = useCreateCollectionMutation();
  const [follow] = useFollowUserMutation();
  const [unfollow] = useUnfollowUserMutation();

  const [activeTab, setActiveTab] = useState<'shelves' | 'collections' | 'activity'>('shelves');

  const user = id ? externalUserData?.data : myData?.data;
  const collections = isMe ? myCollectionsData?.data : collectionsData?.data;

  if (isExternalLoading) return <div>Завантаження профілю...</div>;
  if (!user) return <div>Користувача не знайдено</div>;

  const handleCreateCollection = async (e: React.FormEvent<HTMLFormElement>, close: () => void) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createCollection({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        isPublic: true
      }).unwrap();
      close();
      navigate(`/collections/${result.data.id}`);
    } catch (err) {
      alert('Помилка при створенні підбірки');
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="var(--success)" />;
      case 'rejected': return <XCircle size={16} color="var(--error)" />;
      default: return <Clock size={16} color="var(--warning)" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img src={getImageUrl(user.profilePicture, 'user')} alt={user.username} className={styles.avatar} />
        </div>
        
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <div className={styles.titleWithRole}>
              <h1>{user.username}</h1>
              {user.role !== 'user' && <span className={styles.roleBadge}>{user.role}</span>}
            </div>
            
            {isMe ? (
              <div className={styles.headerActions}>
                <Link to="/profile/edit">
                  <Button variant="outline" size="sm">Редагувати</Button>
                </Link>
                <DialogTrigger>
                  <Button variant="primary" size="sm"><Plus size={16} /> Підбірка</Button>
                  <Modal>
                    <Dialog title="Нова підбірка">
                      {({ close }) => (
                        <Form className={styles.modalForm} onSubmit={(e) => handleCreateCollection(e, close)}>
                          <TextField label="Назва" name="title" isRequired placeholder="Наприклад: Найкраща фантастика 2024" />
                          <TextField label="Опис" name="description" multiline placeholder="Про що ця підбірка?" />
                          <Button type="submit" isLoading={isCreatingColl}>Створити</Button>
                        </Form>
                      )}
                    </Dialog>
                  </Modal>
                </DialogTrigger>
              </div>
            ) : (
              <Button 
                variant={user.isFollowing ? 'outline' : 'primary'} 
                size="sm"
                onPress={() => user.isFollowing ? unfollow(user.id) : follow(user.id)}
              >
                {user.isFollowing ? 'Відписатися' : 'Підписатися'}
              </Button>
            )}
          </div>

          <p className={styles.bio}>{user.bio || 'Інформація про себе відсутня.'}</p>
          
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.followerCount || 0}</span>
              <span className={styles.statLabel}>Підписників</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.followingCount || 0}</span>
              <span className={styles.statLabel}>Підписок</span>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.contentSection}>
        <div className={styles.tabs}>
          <button 
            className={clsx(styles.tab, activeTab === 'shelves' && styles.tabActive)}
            onClick={() => setActiveTab('shelves')}
          >
            <Library size={18} /> Полиці
          </button>
          <button 
            className={clsx(styles.tab, activeTab === 'collections' && styles.tabActive)}
            onClick={() => setActiveTab('collections')}
          >
            <LayoutGrid size={18} /> Підбірки
          </button>
          <button 
            className={clsx(styles.tab, activeTab === 'activity' && styles.tabActive)}
            onClick={() => setActiveTab('activity')}
          >
            <History size={18} /> Активність
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'shelves' && (
            <div className={styles.grid}>
              {shelvesData?.data?.map((shelf: any) => (
                <div key={shelf.id} className={styles.shelfCard}>
                  <h3>{shelf.name}</h3>
                  <p>{shelf.books?.length || 0} книг</p>
                  <div className={styles.miniCovers}>
                    {shelf.books?.slice(0, 4).map((b: any) => (
                      <img key={b.book.id} src={getImageUrl(b.book.coverImage, 'book')} alt="" className={styles.tinyCover} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className={styles.grid}>
              {collections?.map((coll: any) => (
                <Link key={coll.id} to={`/collections/${coll.id}`} className={styles.collectionCard}>
                  <img src={getImageUrl(coll.coverImage, 'book')} alt="" className={styles.collImg} />
                  <div className={styles.collInfo}>
                    <h3>{coll.title}</h3>
                    <p>{coll.description}</p>
                  </div>
                </Link>
              ))}
              {!collections?.length && <p className={styles.empty}>Підбірок ще немає.</p>}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className={styles.activityLayout}>
              {isMe && proposalsData?.data?.length > 0 && (
                <div className={styles.proposalsBlock}>
                  <h3>Ваші пропозиції</h3>
                  <div className={styles.proposalsList}>
                    {proposalsData.data.map((prop: any) => (
                      <div key={prop.id} className={styles.proposalItem}>
                        <div className={styles.propIcon}>
                          {prop.type === 'book' ? <BookOpen size={16} /> : <User size={16} />}
                        </div>
                        <div className={styles.propMain}>
                          <p className={styles.propTitle}>{prop.data.title || prop.data.name}</p>
                          <p className={styles.propType}>{prop.type === 'book' ? 'Книга' : 'Автор'}</p>
                        </div>
                        <div className={styles.propStatus} title={prop.status}>
                          <StatusIcon status={prop.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.activityGrid}>
                <div className={styles.activityCol}>
                  <h3>Рецензії ({ratingsData?.data?.length || 0})</h3>
                  {ratingsData?.data?.map((rating: any) => (
                    <div key={rating.id} className={styles.activityItem}>
                      <div className={styles.activityBook}>
                        <img src={getImageUrl(rating.book?.coverImage, 'book')} alt="" />
                        <div>
                          <Link to={`/books/${rating.book?.id}`} className={styles.bookTitle}>{rating.book?.title}</Link>
                          <div className={styles.stars}>
                            <Star size={12} fill="#fbbf24" color="#fbbf24" /> {rating.rating}
                          </div>
                        </div>
                      </div>
                      <p className={styles.activityText}>{rating.review}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.activityCol}>
                  <h3>Цитати ({quotesData?.data?.length || 0})</h3>
                  {quotesData?.data?.map((quote: any) => (
                    <div key={quote.id} className={styles.activityItem}>
                      <div className={styles.activityBook}>
                         <img src={getImageUrl(quote.book?.coverImage, 'book')} alt="" />
                         <Link to={`/books/${quote.book?.id}`} className={styles.bookTitle}>{quote.book?.title}</Link>
                      </div>
                      <blockquote className={styles.activityQuote}>"{quote.text}"</blockquote>
                    </div>
                  ))}
                </div>
              </div>
              
              {!ratingsData?.data?.length && !quotesData?.data?.length && !proposalsData?.data?.length && (
                <p className={styles.empty}>Активності поки немає.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
