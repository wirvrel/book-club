import { useState } from 'react';
import { Trash2, Search, Eye, Edit, Plus } from 'lucide-react';
import { useDeleteAuthorMutation } from '../adminApi';
import { getImageUrl } from '../../../utils/getImageUrl';
import { AuthorFormModal } from '../components/AuthorFormModal';
import styles from './AdminAuthors.module.css';


import { useGetAuthorsQuery } from '../../../features/authors/authorsApi';

export function AdminAuthors() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'name' as const,
    sortOrder: 'asc' as const,
    search: '',
  });

  const { data, isLoading, error } = useGetAuthorsQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const [deleteAuthor] = useDeleteAuthorMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);

  const handleDelete = async (authorId: string, authorName: string) => {
    if (confirm(`УВАГА! Ви впевнені, що хочете видалити автора "${authorName}"? Ця дія незворотна!`)) {
      setProcessingId(authorId);
      try {
        await deleteAuthor(authorId).unwrap();
      } catch (error) {
        alert('Помилка при видаленні автора');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = () => {
    setEditingAuthor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (author: any) => {
    setEditingAuthor(author);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAuthor(null);
  };

  if (error) {
    return (
      <div className={styles.authors}>
        <div className={styles.error}>
          Помилка завантаження авторів. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authors}>
      <div className={styles.header}>
        <div>
          <h1>Управління авторами</h1>
          <p>Перегляд та модерація авторів у каталозі</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreate}
        >
          <Plus size={20} />
          Створити автора
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Пошук</label>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Пошук по імені автора..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Сортування</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">За іменем</option>
            <option value="created">За датою додавання</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Порядок</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          >
            <option value="asc">Зростання</option>
            <option value="desc">Спадання</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Завантаження авторів...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Автор</th>
                  <th>Національність</th>
                  <th>Тип творчості</th>
                  <th>Дата народження</th>
                  <th>Дата додавання</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((author: any) => (
                  <tr key={author.id}>
                    <td>
                      <div className={styles.authorCell}>
                        {author.profilePicture ? (
                          <img 
                            src={getImageUrl(author.profilePicture, 'author')} 
                            alt={author.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={styles.name}>{author.name}</span>
                      </div>
                    </td>
                    <td>{author.nationality || '-'}</td>
                    <td>{author.typeOfWork || '-'}</td>
                    <td>
                      {author.birthDate 
                        ? new Date(author.birthDate).toLocaleDateString('uk-UA')
                        : '-'}
                    </td>
                    <td>{new Date(author.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div className={styles.actions}>
                        <a
                          href={`/authors/${author.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          title="Переглянути автора"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(author)}
                          title="Редагувати автора"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(author.id, author.name)}
                          disabled={processingId === author.id}
                          title="Видалити автора"
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
          <p>Авторів не знайдено</p>
        </div>
      )}

      <AuthorFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        author={editingAuthor}
      />
    </div>
  );
}
