import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetBookByIdQuery, useGetBookRatingsQuery, useGetBookQuotesQuery, booksApi } from '../features/books/booksApi';
import { useGetShelvesQuery, useAddBookToShelfMutation } from '../features/shelves/shelvesApi';
import { useGetMyCollectionsQuery, useAddBookToCollectionMutation, useCreateCollectionMutation } from '../features/collections/collectionsApi';
import { useCreateRatingMutation } from '../features/ratings/ratingsApi';
import { useCreateQuoteMutation } from '../features/quotes/quotesApi';
import { useToggleLikeMutation } from '../features/likes/likesApi';
import { useGetMeQuery } from '../features/auth/authApi';
import { CommentsSection } from '../features/comments/CommentsSection';
import { getImageUrl } from '../utils/getImageUrl';
import { store } from '../app/store';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { Rating } from '../components/ui/Rating';
import { Modal, Dialog } from '../components/ui/Modal';
import { DialogTrigger, Form, Select, ListBoxItem, Label, ListBox, Popover, Button as RACButton, SelectValue, Checkbox } from 'react-aria-components';
import { Heart, PlusCircle, LogIn, UserPlus, ChevronDown, Check } from 'lucide-react';
import styles from './BookDetails.module.css';

export const bookDetailsLoader = async ({ params }: { params: any }) => {
  const { id } = params;
  const bookPromise = store.dispatch(booksApi.endpoints.getBookById.initiate(id));
  const ratingsPromise = store.dispatch(booksApi.endpoints.getBookRatings.initiate({ id, limit: 10 }));
  const quotesPromise = store.dispatch(booksApi.endpoints.getBookQuotes.initiate({ id, limit: 10 }));
  
  try {
    await Promise.all([bookPromise, ratingsPromise, quotesPromise]);
  } finally {
    bookPromise.unsubscribe();
    ratingsPromise.unsubscribe();
    quotesPromise.unsubscribe();
  }
  
  return { id };
};

export const BookDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery(undefined);
  const { data: bookData } = useGetBookByIdQuery(id!);
  const { data: ratingsData } = useGetBookRatingsQuery({ id: id!, limit: 10 });
  const { data: quotesData } = useGetBookQuotesQuery({ id: id!, limit: 10 });
  const { data: shelvesData } = useGetShelvesQuery(undefined, { skip: !userData });
  const { data: myCollections } = useGetMyCollectionsQuery(undefined, { skip: !userData });
  
  const [addBookToShelf, { isLoading: isAdding }] = useAddBookToShelfMutation();
  const [addBookToCollection] = useAddBookToCollectionMutation();
  const [createCollection, { isLoading: isCreatingColl }] = useCreateCollectionMutation();
  const [createRating, { isLoading: isRatingSubmitting }] = useCreateRatingMutation();
  const [createQuote, { isLoading: isQuoteSubmitting }] = useCreateQuoteMutation();
  const [toggleLike] = useToggleLikeMutation();

  const [ratingValue, setRatingValue] = useState(5);
  const [shelfRating, setShelfRating] = useState(5);
  const [isCreatingNewCollection, setIsCreatingNewCollection] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<any | null>(null);

  const user = userData?.data;
  const book = bookData?.data;

  if (!book) return <div>Книгу не знайдено</div>;

  const handleShelfSubmit = async (e: React.FormEvent<HTMLFormElement>, close: () => void) => {
    e.preventDefault();
    if (!selectedShelf) return;
    
    const fd = new FormData(e.currentTarget);
    try {
      await addBookToShelf({ 
        shelfId: selectedShelf.id, 
        bookId: book.id,
        readingFormat: fd.get('readingFormat') as string,
        startDate: fd.get('startDate') as string || undefined,
        readDate: fd.get('readDate') as string || undefined,
        progressPages: fd.get('progressPages') ? parseInt(fd.get('progressPages') as string) : undefined,
        rating: selectedShelf.name === 'Прочитано' ? shelfRating : undefined,
        notes: fd.get('notes') as string || undefined,
        isPrivate: fd.get('isPrivate') === 'on',
      }).unwrap();
      close();
      setSelectedShelf(null);
    } catch (err) {
      alert('Помилка при додаванні на полицю');
    }
  };

  const handleCreateAndAddToCollection = async (e: React.FormEvent<HTMLFormElement>, close: () => void) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createCollection({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        isPublic: true
      }).unwrap();
      await addBookToCollection({ collectionId: result.data.id, bookId: book.id }).unwrap();
      close();
      navigate(`/collections/${result.data.id}`);
    } catch (err) {
      alert('Помилка при створенні підбірки');
    }
  };

  const handleAddToCollection = async (collectionId: string, close: () => void) => {
    try {
      await addBookToCollection({ collectionId, bookId: book.id }).unwrap();
      close();
    } catch (err) {
      alert('Вже є у цій підбірці');
    }
  };

  const handleLike = async (itemId: string, type: 'rating' | 'quote') => {
    if (!user) {
      alert('Будь ласка, увійдіть, щоб ставити лайки');
      return;
    }
    await toggleLike({ id: itemId, type }).unwrap();
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.coverWrapper}>
          <img src={getImageUrl(book.coverImage, 'book')} alt={book.title} className={styles.cover} />
        </div>
        
        <div className={styles.info}>
          <h1 className={styles.title}>{book.title}</h1>
          <div className={styles.authorList}>
            {book.authors?.map((a: any) => (
              <Link key={a.id} to={`/authors/${a.id}`} className={styles.authorLink}>{a.name}</Link>
            ))}
          </div>
          
          <div className={styles.stats}>
            <div className={styles.rating}>
              <span className={styles.ratingValue}>
                ★ {book.averageRating !== undefined && book.averageRating !== null ? Number(book.averageRating).toFixed(1) : '0.0'}
              </span>
              <span className={styles.ratingCount}>({book.ratingsCount || 0} оцінок)</span>
            </div>
            <div className={styles.badges}>
              {book.language && <span className={styles.badge}>{book.language}</span>}
              {book.pageCount && <span className={styles.badge}>{book.pageCount} стор.</span>}
            </div>
          </div>

          <p className={styles.description}>{book.description || 'Опис відсутній.'}</p>
          
          <div className={styles.actions}>
            {user ? (
              <>
                <DialogTrigger>
                  <Button variant="primary">Додати на полицю</Button>
                  <Modal>
                    <Dialog title={selectedShelf ? `Додати до "${selectedShelf.name}"` : "Оберіть полицю"}>
                      {({ close }) => (
                        <div className={styles.shelvesList}>
                          {!selectedShelf ? (
                            shelvesData?.data?.map((shelf: any) => (
                              <Button 
                                key={shelf.id} 
                                variant="outline" 
                                className={styles.shelfSelectItem}
                                onPress={() => setSelectedShelf(shelf)}
                              >
                                {shelf.name}
                              </Button>
                            ))
                          ) : (
                            <Form className={styles.modalForm} onSubmit={(e) => handleShelfSubmit(e, close)}>
                              <div className={styles.formGrid}>
                                <Select name="readingFormat" defaultValue="physical" className={styles.selectField}>
                                  <Label>Формат</Label>
                                  <RACButton className={styles.selectBtn}>
                                    <SelectValue />
                                    <ChevronDown size={16} />
                                  </RACButton>
                                  <Popover className={styles.selectPopover}>
                                    <ListBox className={styles.selectListBox}>
                                      <ListBoxItem id="physical" className={styles.selectItem}>Паперова</ListBoxItem>
                                      <ListBoxItem id="ebook" className={styles.selectItem}>Електронна</ListBoxItem>
                                      <ListBoxItem id="audiobook" className={styles.selectItem}>Аудіо</ListBoxItem>
                                    </ListBox>
                                  </Popover>
                                </Select>

                                <TextField label="Початок" name="startDate" type="date" />
                              </div>

                              {selectedShelf.name === 'Читаю зараз' && (
                                <TextField label={`Прогрес (з ${book.pageCount})`} name="progressPages" type="number" placeholder="0" />
                              )}

                              {selectedShelf.name === 'Прочитано' && (
                                <>
                                  <TextField label="Дата завершення" name="readDate" type="date" />
                                  <Rating label="Ваша оцінка" value={shelfRating} onChange={setShelfRating} />
                                </>
                              )}

                              <TextField label="Нотатки" name="notes" multiline placeholder="Ваші думки про книгу..." />

                              <Checkbox name="isPrivate" className={styles.checkbox}>
                                <div className={styles.checkboxBox}>
                                  <Check size={14} />
                                </div>
                                Приватний запис
                              </Checkbox>
                              
                              <div className={styles.formActions}>
                                <Button variant="outline" onPress={() => setSelectedShelf(null)}>Назад</Button>
                                <Button type="submit" isLoading={isAdding}>Зберегти</Button>
                              </div>
                            </Form>
                          )}
                        </div>
                      )}
                    </Dialog>
                  </Modal>
                </DialogTrigger>

                <DialogTrigger>
                  <Button variant="outline"><PlusCircle size={18} className={styles.iconWithGap} /> В підбірку</Button>
                  <Modal>
                    <Dialog title={isCreatingNewCollection ? "Нова підбірка" : "Ваші підбірки"}>
                      {({ close }) => (
                        <div className={styles.shelvesList}>
                          {!isCreatingNewCollection ? (
                            <>
                              {myCollections?.data?.map((coll: any) => (
                                <Button 
                                  key={coll.id} 
                                  variant="outline" 
                                  className={styles.shelfSelectItem}
                                  onPress={() => handleAddToCollection(coll.id, close)}
                                >
                                  {coll.title}
                                </Button>
                              ))}
                              <Button variant="ghost" size="sm" onPress={() => setIsCreatingNewCollection(true)} className={styles.mt2}>
                                + Створити нову підбірку
                              </Button>
                            </>
                          ) : (
                            <Form className={styles.modalForm} onSubmit={(e) => handleCreateAndAddToCollection(e, close)}>
                              <TextField label="Назва" name="title" isRequired autoFocus />
                              <TextField label="Опис" name="description" multiline />
                              <div className={styles.formRow}>
                                <Button variant="outline" onPress={() => setIsCreatingNewCollection(false)}>Назад</Button>
                                <Button type="submit" isLoading={isCreatingColl}>Створити та додати</Button>
                              </div>
                            </Form>
                          )}
                        </div>
                      )}
                    </Dialog>
                  </Modal>
                </DialogTrigger>

                <DialogTrigger>
                  <Button variant="secondary">Написати рецензію</Button>
                  <Modal>
                    <Dialog title="Ваш відгук">
                      {({ close }) => (
                        <Form className={styles.modalForm} onSubmit={async (e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          await createRating({ bookId: book.id, rating: ratingValue, review: fd.get('review') }).unwrap();
                          close();
                        }}>
                          <Rating label="Оцінка" value={ratingValue} onChange={setRatingValue} />
                          <TextField label="Рецензія" name="review" multiline />
                          <Button type="submit" isLoading={isRatingSubmitting} className={styles.mt4}>Опублікувати</Button>
                        </Form>
                      )}
                    </Dialog>
                  </Modal>
                </DialogTrigger>
              </>
            ) : (
              <div className={styles.loginCTA}>
                <p>Бажаєте додати книгу на полицю або написати відгук?</p>
                <div className={styles.ctaButtons}>
                  <Link to="/login" className={styles.ctaLogin}><LogIn size={18} /> Увійти</Link>
                  <Link to="/register" className={styles.ctaRegister}><UserPlus size={18} /> Створити акаунт</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.reviewsSection}>
          <h2>Рецензії ({ratingsData?.meta?.total || 0})</h2>
          <div className={styles.list}>
            {ratingsData?.data?.map((rating: any) => (
              <div key={rating.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <Link to={`/users/${rating.user?.id}`} className={styles.reviewerName}>
                    <img src={getImageUrl(rating.user?.profilePicture, 'user')} alt="" className={styles.avatarXs} />
                    {rating.user?.username || 'Користувач'}
                  </Link>
                  <span className={styles.reviewStars}>{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</span>
                </div>
                <p>{rating.review}</p>
                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => handleLike(rating.id, 'rating')}>
                    <Heart size={16} fill={rating.isLiked ? 'currentColor' : 'none'} /> {rating.likesCount || 0}
                  </button>
                </div>
                <CommentsSection itemId={rating.id} type="rating" isGuest={!user} />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.quotesSection}>
          <h2>Цитати ({quotesData?.meta?.total || 0})</h2>
          {user && (
            <DialogTrigger>
              <Button variant="ghost" size="sm" className={styles.mb2}>+ Додати цитату</Button>
              <Modal>
                <Dialog title="Нова цитата">
                  {({ close }) => (
                    <Form className={styles.modalForm} onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const pageNum = fd.get('pageNumber');
                      await createQuote({ 
                        bookId: book.id, 
                        text: fd.get('content') as string, 
                        pageNumber: pageNum ? parseInt(pageNum as string) : undefined 
                      }).unwrap();
                      close();
                    }}>
                      <TextField label="Текст" name="content" isRequired multiline />
                      <TextField label="Стор." name="pageNumber" type="number" />
                      <Button type="submit" isLoading={isQuoteSubmitting}>Зберегти</Button>
                    </Form>
                  )}
                </Dialog>
              </Modal>
            </DialogTrigger>
          )}
          <div className={styles.list}>
            {quotesData?.data?.map((quote: any) => (
              <blockquote key={quote.id} className={styles.quoteCard}>
                <div className={styles.quoteHeader}>
                  <Link to={`/users/${quote.user?.id}`} className={styles.reviewerName}>
                    <img src={getImageUrl(quote.user?.profilePicture, 'user')} alt="" className={styles.avatarXxs} />
                    {quote.user?.username || 'Користувач'}
                  </Link>
                </div>
                <p>"{quote.content || quote.text}"</p>
                {quote.pageNumber && <cite>Стор. {quote.pageNumber}</cite>}
                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => handleLike(quote.id, 'quote')}>
                    <Heart size={16} fill={quote.isLiked ? 'currentColor' : 'none'} /> {quote.likesCount || 0}
                  </button>
                </div>
                <CommentsSection itemId={quote.id} type="quote" isGuest={!user} />
              </blockquote>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
