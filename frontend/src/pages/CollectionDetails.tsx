import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  useGetCollectionByIdQuery, 
  useRemoveBookFromCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useReorderCollectionMutation,
  collectionsApi 
} from '../features/collections/collectionsApi';
import { useGetMeQuery } from '../features/auth/authApi';
import { getImageUrl } from '../utils/getImageUrl';
import { store } from '../app/store';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { Modal, Dialog } from '../components/ui/Modal';
import { DialogTrigger, Form } from 'react-aria-components';
import { Trash2, Edit, ArrowUp, ArrowDown, Settings2, Check, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useToggleLikeMutation } from '../features/likes/likesApi';
import { CommentsSection } from '../features/comments/CommentsSection';
import styles from './CollectionDetails.module.css';
import clsx from 'clsx';

export const collectionDetailsLoader = async ({ params }: { params: any }) => {
  const { id } = params;
  const promise = store.dispatch(collectionsApi.endpoints.getCollectionById.initiate(id));
  try {
    await promise;
  } finally {
    promise.unsubscribe();
  }
  return { id };
};

export const CollectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery(undefined);
  const { data: collectionData, isLoading } = useGetCollectionByIdQuery(id!);
  
  const [removeBook] = useRemoveBookFromCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();
  const [reorderCollection] = useReorderCollectionMutation();
  const [toggleLike] = useToggleLikeMutation();

  const [isManageMode, setIsManageMode] = useState(false);

  const collection = collectionData?.data;
  const isOwner = userData?.data?.id === collection?.userId;

  if (isLoading) return <div>Завантаження підбірки...</div>;
  if (!collection) return <div>Підбірку не знайдено</div>;

  const handleRemoveBook = async (bookId: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити цю книгу з підбірки?')) {
      try {
        await removeBook({ collectionId: collection.id, bookId }).unwrap();
      } catch (err) {
        alert('Помилка при видаленні книги');
      }
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const bookIds = collection.books.map((b: any) => b.book.id);
    const newBookIds = [...bookIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newBookIds.length) return;
    
    [newBookIds[index], newBookIds[targetIndex]] = [newBookIds[targetIndex], newBookIds[index]];
    
    try {
      await reorderCollection({ id: collection.id, bookIds: newBookIds }).unwrap();
    } catch (err) {
      alert('Помилка при зміні порядку');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>, close: () => void) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await updateCollection({
        id: collection.id,
        title: fd.get('title') as string,
        description: fd.get('description') as string,
      }).unwrap();
      close();
    } catch (err) {
      alert('Помилка при оновленні підбірки');
    }
  };

  const handleDeleteCollection = async () => {
    if (window.confirm('Ви ВПЕВНЕНІ, що хочете повністю видалити цю підбірку? Цю дію неможливо скасувати.')) {
      try {
        await deleteCollection(collection.id).unwrap();
        navigate('/collections');
      } catch (err) {
        alert('Помилка при видаленні підбірки');
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.hero}>
          <img src={getImageUrl(collection.coverImage, 'book')} alt="" className={styles.heroImg} />
          <div className={styles.heroContent}>
            <div className={styles.titleRow}>
              <h1>{collection.title}</h1>
              {isOwner && (
                <div className={styles.headerActions}>
                  <Button 
                    variant={isManageMode ? 'primary' : 'outline'} 
                    size="sm" 
                    onPress={() => setIsManageMode(!isManageMode)}
                  >
                    {isManageMode ? <><Check size={16} /> Готово</> : <><Settings2 size={16} /> Керувати списком</>}
                  </Button>
                  
                  <DialogTrigger>
                    <Button variant="outline" size="sm">
                      <Edit size={16} /> Опис
                    </Button>
                    <Modal>
                      <Dialog title="Налаштування підбірки">
                        {({ close }) => (
                          <Form className={styles.modalForm} onSubmit={(e) => handleEditSubmit(e, close)}>
                            <TextField label="Назва" name="title" defaultValue={collection.title} isRequired />
                            <TextField label="Опис" name="description" defaultValue={collection.description} multiline />
                            
                            <div className={styles.modalActions}>
                              <Button type="button" variant="ghost" className={styles.deleteCollBtn} onPress={handleDeleteCollection} isLoading={isDeleting}>
                                <Trash2 size={16} /> Видалити підбірку
                              </Button>
                              <div className={styles.formRightActions}>
                                <Button variant="outline" onPress={close}>Скасувати</Button>
                                <Button type="submit" isLoading={isUpdating}>Зберегти</Button>
                              </div>
                            </div>
                          </Form>
                        )}
                      </Dialog>
                    </Modal>
                  </DialogTrigger>
                </div>
              )}
            </div>
            <p className={styles.description}>{collection.description}</p>
            <div className={styles.meta}>
              <span>Автор: <strong>{collection.user?.username}</strong></span>
              <span>•</span>
              <span>{collection.books?.length || 0} книг</span>
            </div>

            <div className={styles.socialActions}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={styles.likeBtn}
                onPress={() => toggleLike({ id: collection.id, type: 'collection' })}
              >
                <Heart size={20} fill={collection.isLiked ? 'currentColor' : 'none'} className={collection.isLiked ? styles.liked : ''} />
                {collection.likesCount || 0}
              </Button>
              <div className={styles.commentStat}>
                <MessageCircle size={20} />
                {collection.commentsCount || 0}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.booksSection}>
        <div className={clsx(styles.booksGrid, isManageMode && styles.manageGrid)}>
          {collection.books?.map((entry: any, index: number) => (
            <div key={entry.book.id} className={styles.bookCardWrapper}>
              <div className={clsx(styles.bookCardContainer, isManageMode && styles.manageCard)}>
                {}
                {isManageMode ? (
                  <div className={styles.bookCardContent}>
                    <div className={styles.orderBadge}>{index + 1}</div>
                    <img src={getImageUrl(entry.book.coverImage, 'book')} alt="" className={styles.bookCover} />
                    <div className={styles.bookInfo}>
                      <h3>{entry.book.title}</h3>
                      <div className={styles.reorderControls}>
                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0} title="Вгору"><ArrowUp size={16} /></button>
                        <button onClick={() => handleMove(index, 'down')} disabled={index === collection.books.length - 1} title="Вниз"><ArrowDown size={16} /></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link to={`/books/${entry.book.id}`} className={styles.bookCard}>
                    <div className={styles.orderBadge}>{index + 1}</div>
                    <img src={getImageUrl(entry.book.coverImage, 'book')} alt={entry.book.title} className={styles.bookCover} />
                    <div className={styles.bookInfo}>
                      <h3>{entry.book.title}</h3>
                      <p className={styles.bookRating}>★ {Number(entry.book.averageRating || 0).toFixed(1)}</p>
                    </div>
                  </Link>
                )}

                {isOwner && isManageMode && (
                  <button 
                    className={styles.removeBookBtnVisible} 
                    onClick={() => handleRemoveBook(entry.book.id)}
                  >
                    <Trash2 size={18} /> Вилучити
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.commentsSection}>
        <div className={styles.commentsHeader}>
          <h2>Обговорення</h2>
        </div>
        <CommentsSection itemId={collection.id} type="collection" isGuest={!userData} />
      </section>
    </div>
  );
};
