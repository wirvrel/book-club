import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateAuthorMutation, useUpdateAuthorMutation, CreateAuthorInput } from '../adminApi';
import { useGetAuthorByIdQuery } from '../../../features/authors/authorsApi';
import styles from './BookFormModal.module.css';

interface AuthorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  author?: any;
}

export function AuthorFormModal({ isOpen, onClose, author }: AuthorFormModalProps) {
  const [createAuthor, { isLoading: isCreating }] = useCreateAuthorMutation();
  const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();

    const { data: fullAuthorData, isLoading: isLoadingAuthor } = useGetAuthorByIdQuery(author?.id, {
    skip: !author?.id || !isOpen,
  });
  
  const [formData, setFormData] = useState<CreateAuthorInput>({
    name: '',
    bio: '',
    birthDate: '',
    birthPlace: '',
    nationality: '',
    typeOfWork: '',
    website: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (author && fullAuthorData) {
        const authorDetails = fullAuthorData.data;
      setFormData({
        name: authorDetails.name || '',
        bio: authorDetails.bio || '',
        birthDate: authorDetails.birthDate || '',
        birthPlace: authorDetails.birthPlace || '',
        nationality: authorDetails.nationality || '',
        typeOfWork: authorDetails.typeOfWork || '',
        website: authorDetails.website || '',
      });
    } else if (!author) {
        setFormData({
        name: '',
        bio: '',
        birthDate: '',
        birthPlace: '',
        nationality: '',
        typeOfWork: '',
        website: '',
      });
    }
    setErrors({});
  }, [author, fullAuthorData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

      if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Ім\'я автора обов\'язкове';
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
      if (author) {
        await updateAuthor({ id: author.id, data: formData }).unwrap();
      } else {
        await createAuthor(formData).unwrap();
      }
      onClose();
    } catch (error: any) {
      alert(`Помилка: ${error.data?.message || 'Не вдалося зберегти автора'}`);
    }
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating || isLoadingAuthor;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{author ? 'Редагувати автора' : 'Створити автора'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {isLoadingAuthor ? (
          <div className={styles.modalBody}>
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Завантаження даних автора...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  Ім'я автора<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Введіть ім'я автора"
                />
                {errors.name && <div className={styles.error}>{errors.name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>Біографія</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Біографія автора"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Дата народження</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Місце народження</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    placeholder="Наприклад: Київ, Україна"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Національність</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="Наприклад: Українець"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Тип творчості</label>
                  <select
                    name="typeOfWork"
                    value={formData.typeOfWork}
                    onChange={handleChange}
                  >
                    <option value="">Не вказано</option>
                    <option value="novelist">Романіст</option>
                    <option value="poet">Поет</option>
                    <option value="playwright">Драматург</option>
                    <option value="essayist">Есеїст</option>
                    <option value="journalist">Журналіст</option>
                    <option value="other">Інше</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Вебсайт</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
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
              {isCreating || isUpdating ? 'Збереження...' : author ? 'Оновити' : 'Створити'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
