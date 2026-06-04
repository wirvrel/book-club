import { useState } from 'react';
import { useGetCommentsQuery, useCreateCommentMutation } from './commentsApi';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Link } from 'react-router-dom';
import styles from './Comments.module.css';
import { Reply, Heart } from 'lucide-react';
import { useToggleLikeMutation } from '../likes/likesApi';

interface CommentsSectionProps {
  itemId: string;
  type: 'rating' | 'quote' | 'collection';
  isGuest?: boolean;
}

export const CommentsSection = ({ itemId, type, isGuest }: CommentsSectionProps) => {
  const { data: commentsData, isLoading } = useGetCommentsQuery({ itemId, itemType: type });
  const [createComment, { isLoading: isSubmitting }] = useCreateCommentMutation();
  const [toggleLike] = useToggleLikeMutation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleLike = async (commentId: string) => {
    if (isGuest) {
      alert('Будь ласка, увійдіть, щоб ставити лайки');
      return;
    }
    await toggleLike({ id: commentId, type: 'comment' }).unwrap();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, parentId?: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    if (!content.trim()) return;

    try {
      await createComment({
        commentableId: itemId,
        commentableType: type,
        content,
        parentId
      }).unwrap();
      (e.target as HTMLFormElement).reset();
      setReplyTo(null);
    } catch (err) {
      alert('Помилка при додаванні коментаря');
    }
  };

  const rootComments = commentsData?.data?.filter((c: any) => !c.parentId) || [];
  const getReplies = (parentId: string) => commentsData?.data?.filter((c: any) => c.parentId === parentId) || [];

  if (!isExpanded) {
    return (
      <button className={styles.expandBtn} onClick={() => setIsExpanded(true)}>
        Показати коментарі ({commentsData?.data?.length || 0})
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {isLoading ? (
          <p>Завантаження...</p>
        ) : rootComments.length ? (
          rootComments.map((comment: any) => (
            <div key={comment.id} className={styles.commentWrapper}>
              <div className={styles.comment}>
                <div className={styles.header}>
                  <Link to={`/users/${comment.user.id}`} className={styles.username}>
                    {comment.user.username}
                  </Link>
                  <span className={styles.date}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className={styles.content}>{comment.content}</p>
                <div className={styles.commentActions}>
                  <button className={styles.commentActionBtn} onClick={() => handleLike(comment.id)}>
                    <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} className={comment.isLiked ? styles.liked : ''} />
                    {comment.likesCount || 0}
                  </button>
                  {!isGuest && (
                    <button className={styles.commentActionBtn} onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                      <Reply size={14} /> Відповісти
                    </button>
                  )}
                </div>

                {!isGuest && replyTo === comment.id && (
                  <form onSubmit={(e) => handleSubmit(e, comment.id)} className={styles.replyForm}>
                    <TextField name="content" placeholder="Ваша відповідь..." size="sm" autoFocus />
                    <Button type="submit" size="sm" isLoading={isSubmitting}>OK</Button>
                  </form>
                )}
              </div>

              <div className={styles.replies}>
                {getReplies(comment.id).map((reply: any) => (
                  <div key={reply.id} className={styles.comment}>
                    <div className={styles.header}>
                      <Link to={`/users/${reply.user.id}`} className={styles.username}>{reply.user.username}</Link>
                      <span className={styles.date}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={styles.content}>{reply.content}</p>
                    <div className={styles.commentActions}>
                      <button className={styles.commentActionBtn} onClick={() => handleLike(reply.id)}>
                        <Heart size={12} fill={reply.isLiked ? 'currentColor' : 'none'} className={reply.isLiked ? styles.liked : ''} />
                        {reply.likesCount || 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>Коментарів ще немає.</p>
        )}
      </div>

      {!isGuest ? (
        <form onSubmit={(e) => handleSubmit(e)} className={styles.mainForm}>
          <TextField name="content" placeholder="Напишіть коментар..." />
          <Button type="submit" size="sm" isLoading={isSubmitting}>Відправити</Button>
        </form>
      ) : (
        <p className={styles.guestMsg}>
          <Link to="/login">Увійдіть</Link>, щоб додати коментар.
        </p>
      )}
      
      <button className={styles.collapseBtn} onClick={() => setIsExpanded(false)}>
        Приховати
      </button>
    </div>
  );
};
