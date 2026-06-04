import { Link } from 'react-router-dom';
import { Users, Book, Star, TrendingUp, FileText, ChevronRight, Check, X } from 'lucide-react';
import { useGetDashboardStatsQuery, useGetRecentProposalsQuery, useApproveProposalMutation, useRejectProposalMutation } from '../adminApi';
import { StatsCard } from '../components/StatsCard';
import styles from './AdminDashboard.module.css';
import { useState } from 'react';

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery();
  const { data: proposals, isLoading: proposalsLoading } = useGetRecentProposalsQuery();
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
    if (reason) {
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

  if (statsError) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.error}>
          Помилка завантаження статистики. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Огляд платформи та статистика</p>
      </div>

      {statsLoading ? (
        <div className={styles.loading}>Завантаження статистики...</div>
      ) : stats ? (
        <div className={styles.statsGrid}>
          <StatsCard
            title="Всього користувачів"
            value={stats.totalUsers}
            icon={<Users size={28} />}
            color="primary"
          />
          <StatsCard
            title="Всього книг"
            value={stats.totalBooks}
            icon={<Book size={28} />}
            color="secondary"
          />
          <StatsCard
            title="Всього рецензій"
            value={stats.totalRatings}
            icon={<Star size={28} />}
            color="success"
          />
          <StatsCard
            title="Активні користувачі"
            value={stats.activeUsersLastMonth}
            icon={<TrendingUp size={28} />}
            color="warning"
          />
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Останні пропозиції</h2>
          <Link to="/admin/proposals" className={styles.viewAllLink}>
            Дивитись всі <ChevronRight size={16} />
          </Link>
        </div>

        {proposalsLoading ? (
          <div className={styles.loading}>Завантаження пропозицій...</div>
        ) : proposals && proposals.length > 0 ? (
          <div className={styles.proposalsList}>
            {proposals.map((proposal) => (
              <div key={proposal.id} className={styles.proposalItem}>
                <div className={styles.proposalInfo}>
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
                <div className={styles.proposalActions}>
                  <button
                    onClick={() => handleApprove(proposal.id)}
                    disabled={processingId === proposal.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    <Check size={16} /> Затвердити
                  </button>
                  <button
                    onClick={() => handleReject(proposal.id)}
                    disabled={processingId === proposal.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#C62828',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    <X size={16} /> Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>Немає нових пропозицій</p>
          </div>
        )}
      </div>
    </div>
  );
}
