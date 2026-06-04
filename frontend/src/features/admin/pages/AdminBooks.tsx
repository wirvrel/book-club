import { useState } from 'react';
import { Trash2, Search, Eye, Edit, Plus } from 'lucide-react';
import { useGetAllBooksQuery, useDeleteBookMutation, BookFilters } from '../adminApi';
import { getImageUrl } from '../../../utils/getImageUrl';
import { BookFormModal } from '../components/BookFormModal';
import styles from './AdminBooks.module.css';

export function AdminBooks() {
  const [filters, setFilters] = useState<BookFilters>({
    page: 1,
    limit: 20,
    sortBy: 'created',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useGetAllBooksQuery(filters);
  const [deleteBook] = useDeleteBookMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  const handleDelete = async (bookId: string, bookTitle: string) => {
    if (confirm(`УВАГА! Ви впевнені, що хочете видалити книгу "${bookTitle}"? Ця дія незворотна!`)) {
      setProcessingId(bookId);
      try {
        await deleteBook(bookId).unwrap();
      } catch (error) {
        alert('Помилка при видаленні книги');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleFilterChange = (key: keyof BookFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const handleEdit = (book: any) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
  };

  if (error) {
    return (
      <div className={styles.books}>
        <div className={styles.error}>
          Помилка завантаження книг. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.books}>
      <div className={styles.header}>
        <div>
          <h1>Управління книгами</h1>
          <p>Перегляд та модерація книг у каталозі</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreate}
        >
          <Plus size={20} />
          Створити книгу
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Пошук</label>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Пошук по назві книги..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Сортування</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="created">За датою додавання</option>
            <option value="title">За назвою</option>
            <option value="rating">За рейтингом</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Порядок</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          >
            <option value="desc">Спадання</option>
            <option value="asc">Зростання</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Завантаження книг...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Книга</th>
                  <th>Автор(и)</th>
                  <th>Рейтинг</th>
                  <th>Рецензій</th>
                  <th>Дата додавання</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((book: any) => (
                  <tr key={book.id}>
                    <td>
                      <div className={styles.bookCell}>
                        {book.coverImage ? (
                          <img 
                            src={getImageUrl(book.coverImage, 'book')} 
                            alt={book.title}
                            className={styles.cover}
                          />
                        ) : (
                          <div className={styles.coverPlaceholder}>
                            {book.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={styles.title}>{book.title}</span>
                      </div>
                    </td>
                    <td>
                      {book.authors && book.authors.length > 0 
                        ? book.authors.map((a: any) => a.name).join(', ')
                        : '-'}
                    </td>
                    <td>
                      <div className={styles.rating}>
                        ⭐ {book.averageRating ? Number(book.averageRating).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td>{book.ratingsCount || 0}</td>
                    <td>{new Date(book.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div className={styles.actions}>
                        <a
                          href={`/books/${book.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          title="Переглянути книгу"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(book)}
                          title="Редагувати книгу"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(book.id, book.title)}
                          disabled={processingId === book.id}
                          title="Видалити книгу"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(data.meta.page - 1)}
                disabled={data.meta.page === 1}
              >
                Попередня
              </button>
              <span className={styles.paginationInfo}>
                Сторінка {data.meta.page} з {data.meta.totalPages} • Всього: {data.meta.total}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(data.meta.page + 1)}
                disabled={data.meta.page === data.meta.totalPages}
              >
                Наступна
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>Книг не знайдено</p>
        </div>
      )}

      <BookFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        book={editingBook}
      />
    </div>
  );
}
