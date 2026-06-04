import { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { 
  useGetProposalsQuery, 
  useApproveProposalMutation, 
  useRejectProposalMutation,
  ProposalFilters 
} from '../adminApi';
import styles from './AdminProposals.module.css';

export function AdminProposals() {
  const [filters, setFilters] = useState<ProposalFilters>({
    page: 1,
    limit: 20,
    status: 'pending',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useGetProposalsQuery(filters);
  const [approveProposal] = useApproveProposalMutation();
  const [rejectProposal] = useRejectProposalMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (confirm('Ви впевнені, що хочете затвердити цю пропозицію?')) {
      setProcessingId(id);
      try {
        await approveProposal({ id }).unwrap();
      } catch (error) {
        alert('Помилка при затвердженні пропозиції');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Вкажіть причину відхилення:');
    if (reason && reason.trim()) {
      setProcessingId(id);
      try {
        await rejectProposal({ id, rejectionReason: reason }).unwrap();
      } catch (error) {
        alert('Помилка при відхиленні пропозиції');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleFilterChange = (key: keyof ProposalFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className={styles.proposals}>
        <div className={styles.error}>
          Помилка завантаження пропозицій. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.proposals}>
      <div className={styles.header}>
        <h1>Управління пропозиціями</h1>
        <p>Модерація пропозицій книг та авторів від користувачів</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Тип</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
          >
            <option value="">Всі типи</option>
            <option value="book">Книги</option>
            <option value="author">Автори</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Статус</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          >
            <option value="">Всі статуси</option>
            <option value="pending">Очікують</option>
            <option value="approved">Затверджені</option>
            <option value="rejected">Відхилені</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Сортування</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          >
            <option value="desc">Нові спочатку</option>
            <option value="asc">Старі спочатку</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Завантаження пропозицій...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.proposalsList}>
            {data.data.map((proposal) => (
              <div key={proposal.id} className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <div>
                    <span className={`${styles.proposalType} ${styles[proposal.type]}`}>
                      {proposal.type === 'book' ? 'Книга' : 'Автор'}
                    </span>
                    <div className={styles.proposalTitle}>
                      {proposal.title || proposal.name}
                    </div>
                    <div className={styles.proposalMeta}>
                      Від: {proposal.user?.username || 'Невідомий'} • {new Date(proposal.createdAt).toLocaleDateString('uk-UA')}
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[proposal.status]}`}>
                    {proposal.status === 'pending' && 'Очікує'}
                    {proposal.status === 'approved' && 'Затверджено'}
                    {proposal.status === 'rejected' && 'Відхилено'}
                  </span>
                </div>

                <div className={styles.proposalData}>
                  <h4>Деталі пропозиції</h4>
                  <div className={styles.dataGrid}>
                    {proposal.type === 'book' ? (
                      <>
                        {proposal.description && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Опис</span>
                            <span className={styles.dataValue}>{proposal.description}</span>
                          </div>
                        )}
                        {proposal.pageCount && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Сторінок</span>
                            <span className={styles.dataValue}>{proposal.pageCount}</span>
                          </div>
                        )}
                        {proposal.isbn && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>ISBN</span>
                            <span className={styles.dataValue}>{proposal.isbn}</span>
                          </div>
                        )}
                        {proposal.publishedDate && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Дата видання</span>
                            <span className={styles.dataValue}>{proposal.publishedDate}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {proposal.bio && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Біографія</span>
                            <span className={styles.dataValue}>{proposal.bio}</span>
                          </div>
                        )}
                        {proposal.birthDate && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Дата народження</span>
                            <span className={styles.dataValue}>{proposal.birthDate}</span>
                          </div>
                        )}
                        {proposal.nationality && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Національність</span>
                            <span className={styles.dataValue}>{proposal.nationality}</span>
                          </div>
                        )}
                        {proposal.typeOfWork && (
                          <div className={styles.dataItem}>
                            <span className={styles.dataLabel}>Тип творчості</span>
                            <span className={styles.dataValue}>{proposal.typeOfWork}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {proposal.status === 'pending' && (
                  <div className={styles.proposalActions}>
                    <button
                      className={`${styles.button} ${styles.approveButton}`}
                      onClick={() => handleApprove(proposal.id)}
                      disabled={processingId === proposal.id}
                    >
                      <Check size={18} /> Затвердити
                    </button>
                    <button
                      className={`${styles.button} ${styles.rejectButton}`}
                      onClick={() => handleReject(proposal.id)}
                      disabled={processingId === proposal.id}
                    >
                      <X size={18} /> Відхилити
                    </button>
                  </div>
                )}

                {proposal.status === 'rejected' && proposal.rejectionReason && (
                  <div className={styles.proposalData}>
                    <h4>Причина відхилення</h4>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                      {proposal.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
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
                Сторінка {data.meta.page} з {data.meta.totalPages}
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
          <p>Немає пропозицій за вказаними фільтрами</p>
        </div>
      )}
    </div>
  );
}
