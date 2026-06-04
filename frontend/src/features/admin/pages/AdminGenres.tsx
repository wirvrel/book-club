import { useState } from 'react';
import { Trash2, Search, Edit, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useGetAllGenresQuery, useGetGenreHierarchyQuery, useDeleteGenreMutation } from '../adminApi';
import { GenreFormModal } from '../components/GenreFormModal';
import styles from './AdminGenres.module.css';
interface GenreNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  bookCount: number;
  children: GenreNode[];
}

function GenreTreeNode({ 
  node, 
  level = 0, 
  onEdit, 
  onDelete, 
  processingId,
  expandedIds,
  toggleExpand 
}: { 
  node: GenreNode; 
  level?: number;
  onEdit: (genre: any) => void;
  onDelete: (id: string, name: string) => void;
  processingId: string | null;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <div className={styles.treeNode} style={{ marginLeft: level * 24 }}>
      <div className={styles.treeRow}>
        <div className={styles.treeContent}>
          {hasChildren ? (
            <button 
              className={styles.expandButton}
              onClick={() => toggleExpand(node.id)}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className={styles.expandPlaceholder} />
          )}
          <span className={styles.genreName}>{node.name}</span>
          {node.description && (
            <span className={styles.genreDescription}>{node.description}</span>
          )}
        </div>
        <div className={styles.treeActions}>
          <span className={styles.bookCount}>{node.bookCount} книг</span>
          <button
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={() => onEdit(node)}
            title="Редагувати жанр"
          >
            <Edit size={16} />
          </button>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => onDelete(node.id, node.name)}
            disabled={processingId === node.id}
            title="Видалити жанр"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className={styles.treeChildren}>
          {node.children.map((child) => (
            <GenreTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              processingId={processingId}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminGenres() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 100,
    sortBy: 'name' as const,
    sortOrder: 'asc' as const,
    search: '',
  });

  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: hierarchyData, isLoading: isLoadingHierarchy } = useGetGenreHierarchyQuery();
  const { data, isLoading, error } = useGetAllGenresQuery({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const [deleteGenre] = useDeleteGenreMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (genreId: string, genreName: string) => {
    if (confirm(`УВАГА! Ви впевнені, що хочете видалити жанр "${genreName}"? Ця дія незворотна!`)) {
      setProcessingId(genreId);
      try {
        await deleteGenre(genreId).unwrap();
      } catch (error) {
        alert('Помилка при видаленні жанру');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreate = () => {
    setEditingGenre(null);
    setIsModalOpen(true);
  };

  const handleEdit = (genre: any) => {
    setEditingGenre(genre);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGenre(null);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className={styles.genres}>
        <div className={styles.error}>
          Помилка завантаження жанрів. Перевірте підключення до сервера.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.genres}>
      <div className={styles.header}>
        <div>
          <h1>Управління жанрами</h1>
          <p>Перегляд та модерація жанрів у каталозі</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={handleCreate}
        >
          <Plus size={20} />
          Створити жанр
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Пошук</label>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Пошук по назві жанру..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Перегляд</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'tree' | 'list')}
          >
            <option value="tree">Дерево</option>
            <option value="list">Список</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Сортування</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="name">За назвою</option>
            <option value="created">За датою додавання</option>
            <option value="bookCount">За кількістю книг</option>
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

      {isLoading || isLoadingHierarchy ? (
        <div className={styles.loading}>Завантаження жанрів...</div>
      ) : viewMode === 'tree' && hierarchyData?.data ? (
        <div className={styles.treeView}>
          {hierarchyData.data.map((node: GenreNode) => (
            <GenreTreeNode
              key={node.id}
              node={node}
              onEdit={handleEdit}
              onDelete={handleDelete}
              processingId={processingId}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
          {hierarchyData.data.length === 0 && (
            <div className={styles.emptyState}>
              <p>Жанрів не знайдено</p>
            </div>
          )}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Опис</th>
                  <th>Батько</th>
                  <th>Книг</th>
                  <th>Дата додавання</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((genre: any) => (
                  <tr key={genre.id}>
                    <td>
                      <span className={styles.name}>{genre.name}</span>
                    </td>
                    <td>
                      <span className={styles.truncate} title={genre.description}>
                        {genre.description || '-'}
                      </span>
                    </td>
                    <td>{genre.parentId ? 'Так' : '-'}</td>
                    <td>{genre.bookCount || 0}</td>
                    <td>{new Date(genre.createdAt).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEdit(genre)}
                          title="Редагувати жанр"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDelete(genre.id, genre.name)}
                          disabled={processingId === genre.id}
                          title="Видалити жанр"
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
          <p>Жанрів не знайдено</p>
        </div>
      )}

      <GenreFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        genre={editingGenre}
      />
    </div>
  );
}