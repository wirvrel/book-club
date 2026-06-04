import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateGenreMutation, useUpdateGenreMutation, useGetAllGenresQuery, CreateGenreInput } from '../adminApi';
import styles from './BookFormModal.module.css';

interface GenreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  genre?: any;
}

export function GenreFormModal({ isOpen, onClose, genre }: GenreFormModalProps) {
  const [createGenre, { isLoading: isCreating }] = useCreateGenreMutation();
  const [updateGenre, { isLoading: isUpdating }] = useUpdateGenreMutation();
  
  const { data: genresData } = useGetAllGenresQuery({ page: 1, limit: 100 });
  
  const [formData, setFormData] = useState<CreateGenreInput>({
    name: '',
    description: '',
    parentId: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (genre) {
      setFormData({
        name: genre.name || '',
        description: genre.description || '',
        parentId: genre.parentId || undefined,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: undefined,
      });
    }
    setErrors({});
  }, [genre, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'parentId') {
      setFormData(prev => ({ ...prev, [name]: value || undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Назва жанру обов\'язкова';
    }
    
    if (formData.name && formData.name.length > 50) {
      newErrors.name = 'Назва жанру не може перевищувати 50 символів';
    }

      if (formData.parentId === genre?.id) {
      newErrors.parentId = 'Жанр не може бути батьком самого себе';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      if (genre) {
        await updateGenre({ id: genre.id, data: formData }).unwrap();
      } else {
        await createGenre(formData).unwrap();
      }
      onClose();
    } catch (error: any) {
      alert(`Помилка: ${error.data?.message || 'Не вдалося зберегти жанр'}`);
    }
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating;

    const availableParents = genresData?.data?.filter((g: any) => {
    if (!genre) return true;
    return g.id !== genre.id;
  }) || [];

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{genre ? 'Редагувати жанр' : 'Створити жанр'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  Назва жанру<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Введіть назву жанру"
                  maxLength={50}
                />
                {errors.name && <div className={styles.error}>{errors.name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>Опис</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Опис жанру"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Батьківський жанр</label>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleChange}
                >
                  <option value="">Без батька (кореневий жанр)</option>
                  {availableParents.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {errors.parentId && <div className={styles.error}>{errors.parentId}</div>}
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={onClose}
              disabled={isLoading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={isLoading}
            >
              {isLoading ? 'Збереження...' : genre ? 'Оновити' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}