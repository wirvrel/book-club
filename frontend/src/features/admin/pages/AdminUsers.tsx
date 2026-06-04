import { useState } from 'react';
import { Shield, Ban, Trash2, Search, Edit2 } from 'lucide-react';
import { 
  useGetAllUsersQuery, 
  useUpdateUserRoleMutation, 
  useUpdateUserMutation,
  useBanUserMutation, 
  useDeleteUserMutation,
  UserFilters 
} from '../adminApi';
import { UserFormModal } from '../components/UserFormModal';
import styles from './AdminUsers.module.css';

export function AdminUsers() {
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    sortBy: 'created',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useGetAllUsersQuery(filters);
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [banUser] = useBanUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (confirm(`Змінити роль користувача на "${newRole}"?`)) {
      setProcessingId(userId);
      try {
        await updateUserRole({ id: userId, role: newRole as 'user' | 'admin' }).unwrap();
      } catch (error) {
        alert('Помилка при зміні ролі користувача');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleBan = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'розблокувати' : 'заблокувати';
    if (confirm(`Ви впевнені, що хочете ${action} цього користувача?`)) {
      setProcessingId(userId);
      try {
        await banUser({ id: userId, banned: !currentlyBanned }).unwrap();
      } catch (error) {
        alert(`Помилка при ${action === 'розблокувати' ? 'розблокуванні' : 'блокуванні'} користувача`);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (confirm(`УВАГА! Ви впевнені, що хочете видалити користувача "${username}"? Ця дія незворотна!`)) {
      setProcessingId(userId);
      try {
        await deleteUser(userId).unwrap();
      } catch (error) {
        alert('Помилка при видаленні користувача');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className={styles.users}>
        <div className={styles.error}>
          Помилка завантаження користувачів. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.users}>
      <div className={styles.header}>
        <h1>Управління користувачами</h1>
        <p>Перегляд та модерація користувачів платформи</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Пошук</label>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Пошук по username або email..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Роль</label>
          <select
            value={filters.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
          >
            <option value="">Всі ролі</option>
            <option value="user">Користувач</option>
            <option value="admin">Адміністратор</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Сортування</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="created">За датою реєстрації</option>
            <option value="username">За іменем</option>
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
        <div className={styles.loading}>Завантаження користувачів...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Користувач</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Дата реєстрації</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.username}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={styles.username}>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(user)}
                          disabled={processingId === user.id}
                          title="Редагувати дані"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.roleButton}`}
                          onClick={() => handleRoleChange(user.id, user.role)}
                          disabled={processingId === user.id}
                          title={user.role === 'admin' ? 'Зробити користувачем' : 'Зробити адміністратором'}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.banButton}`}
                          onClick={() => handleBan(user.id, false)}
                          disabled={processingId === user.id}
                          title="Заблокувати/Розблокувати"
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={processingId === user.id}
                          title="Видалити користувача"
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
          <p>Користувачів не знайдено</p>
        </div>
      )}

      {selectedUser && (
        <UserFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </div>
  );
}
