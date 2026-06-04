import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/getImageUrl';
import { Heart, MessageCircle, BookOpen } from 'lucide-react';
import { useToggleLikeMutation } from '../likes/likesApi';
import { CommentsSection } from '../comments/CommentsSection';
import { useState } from 'react';
import styles from './Feed.module.css';

interface FeedItemProps {
  item: any;
  currentUserId?: string;
}

export const FeedItem = ({ item, currentUserId }: FeedItemProps) => {
  const [toggleLike] = useToggleLikeMutation();
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) {
      alert('Будь ласка, увійдіть, щоб ставити лайки');
      return;
    }
    

    const type = item.type; 
    

    const id = item.data.id;

    if (!id) {
      console.error('Missing ID for like:', item);
      return;
    }

    try {
      await toggleLike({ id, type }).unwrap();
    } catch (err) {

    }
  };

  return (
    <div className={styles.item}>
      <div className={styles.header}>
        <Link to={`/users/${item.user.id}`} className={styles.avatar}>
          <img src={getImageUrl(item.user.profilePicture, 'user')} alt="" />
        </Link>
        <div className={styles.headerInfo}>
          <p className={styles.userAction}>
            <Link to={`/users/${item.user.id}`} className={styles.username}>{item.user.username}</Link>
            <span className={styles.actionText}>
              {item.type === 'rating' && ` оцінив книгу на ${item.data.rating} ★`}
              {item.type === 'quote' && ' поділився цитатою'}
              {item.type === 'collection' && ' створив нову підбірку'}
            </span>
          </p>
          <span className={styles.time}>{new Date(item.createdAt).toLocaleString('uk-UA')}</span>
        </div>
      </div>

      <div className={styles.content}>
        {}
        {(item.type === 'rating' || item.type === 'quote') && item.data.book && (
          <div className={styles.bookContext}>
            <Link to={`/books/${item.data.book.id}`} className={styles.miniBookCard}>
              <img src={getImageUrl(item.data.book.coverImage, 'book')} alt="" />
              <div className={styles.miniBookInfo}>
                <h4>{item.data.book.title}</h4>
                <p>Переглянути книгу</p>
              </div>
            </Link>
          </div>
        )}

        <div className={styles.body}>
          {item.type === 'rating' && item.data.review && (
            <p className={styles.text}>"{item.data.review}"</p>
          )}
          {item.type === 'quote' && (
            <blockquote className={styles.quote}>
              "{item.data.text || item.data.content}"
              {item.data.pageNumber && <cite>— Стор. {item.data.pageNumber}</cite>}
            </blockquote>
          )}
          {item.type === 'collection' && (
            <Link to={`/collections/${item.data.id}`} className={styles.collectionPreview}>
              <div className={styles.collIcon}><BookOpen size={24} /></div>
              <div>
                <h3>{item.data.title}</h3>
                <p>{item.data.description}</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={handleLike}>
          <Heart size={18} fill={item.data.isLiked ? 'currentColor' : 'none'} className={item.data.isLiked ? styles.likedIcon : ''} />
          {item.data.likesCount || 0}
        </button>
        <button className={styles.actionBtn} onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={18} />
          {item.data.commentsCount || 0}
        </button>
      </div>

      {showComments && (
        <div className={styles.commentsWrapper}>
          <CommentsSection 
            itemId={item.data.id} 
            type={item.type === 'rating' ? 'rating' : item.type === 'quote' ? 'quote' : 'collection'} 
            isGuest={!currentUserId} 
          />
        </div>
      )}
    </div>
  );
};
