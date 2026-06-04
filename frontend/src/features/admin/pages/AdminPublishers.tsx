import { useState } from 'react';
import { Trash2, Search, Eye, Edit, Plus } from 'lucide-react';
import { useGetAllPublishersQuery, useDeletePublisherMutation } from '../adminApi';
import { PublisherFormModal } from '../components/PublisherFormModal';
import styles from './AdminAuthors.module.css';

export function AdminPublishers() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'name' as const,
    sortOrder: 'asc' as const,
    search: '',
  });

  const { data, isLoading, error } = useGetAllPublishersQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const [deletePublisher] = useDeletePublisherMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<any>(null);

  const handleDelete = async (publisherId: string, publisherName: string) => {
    if (confirm(`УВАГА! Ви впевнені, що хочете видалити видавництво "${publisherName}"? Ця дія незворотна!`)) {
      setProcessingId(publisherId);
      try {
        await deletePublisher(publisherId).unwrap();
      } catch (error) {
        alert('Помилка при видаленні видавництва');
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
    setEditingPublisher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (publisher: any) => {
    setEditingPublisher(publisher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPublisher(null);
  };

  if (error) {
    return (
      <div className={styles.authors}>
        <div className={styles.error}>
          Помилка завантаження видавництв. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authors}>
      <div className={styles.header}>
        <div>
          <h1>Управління видавництвами</h1>
          <p>Перегляд та модерація видавництв у каталозі</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreate}
        >
          <Plus size={20} />
          Створити видавництво
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Пошук</label>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Пошук по назві видавництва..."
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
            <option value="name">За назвою</option>
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
        <div className={styles.loading}>Завантаження видавництв...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Опис</th>
                  <th>Рік заснування</th>
                  <th>Країна</th>
                  <th>Місто</th>
                  <th>Вебсайт</th>
                  <th>Дата додавання</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((publisher: any) => (
                  <tr key={publisher.id}>
                    <td>
                      <span className={styles.name}>{publisher.name}</span>
                    </td>
                    <td>
                      <span className={styles.truncate} title={publisher.description}>
                        {publisher.description || '-'}
                      </span>
                    </td>
                    <td>{publisher.foundedYear || '-'}</td>
                    <td>{publisher.country || '-'}</td>
                    <td>{publisher.city || '-'}</td>
                    <td>
                      {publisher.website ? (
                        <a 
                          href={publisher.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          Перейти
                        </a>
                      ) : '-'}
                    </td>
                    <td>{new Date(publisher.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(publisher)}
                          title="Редагувати видавництво"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(publisher.id, publisher.name)}
                          disabled={processingId === publisher.id}
                          title="Видалити видавництво"
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
          <p>Видавництв не знайдено</p>
        </div>
      )}

      <PublisherFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        publisher={editingPublisher}
      />
    </div>
  );
}