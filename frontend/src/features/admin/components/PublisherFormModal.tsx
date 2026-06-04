import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreatePublisherMutation, useUpdatePublisherMutation, CreatePublisherInput } from '../adminApi';
import styles from './BookFormModal.module.css';

interface PublisherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisher?: any;
}

export function PublisherFormModal({ isOpen, onClose, publisher }: PublisherFormModalProps) {
  const [createPublisher, { isLoading: isCreating }] = useCreatePublisherMutation();
  const [updatePublisher, { isLoading: isUpdating }] = useUpdatePublisherMutation();
  
  const [formData, setFormData] = useState<CreatePublisherInput>({
    name: '',
    description: '',
    foundedYear: undefined,
    website: '',
    country: '',
    city: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (publisher) {
      setFormData({
        name: publisher.name || '',
        description: publisher.description || '',
        foundedYear: publisher.foundedYear || undefined,
        website: publisher.website || '',
        country: publisher.country || '',
        city: publisher.city || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        foundedYear: undefined,
        website: '',
        country: '',
        city: '',
      });
    }
    setErrors({});
  }, [publisher, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'foundedYear') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
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
      newErrors.name = 'Назва видавництва обов\'язкова';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Некоректна URL-адреса';
    }

    if (formData.foundedYear && (formData.foundedYear < 1800 || formData.foundedYear > new Date().getFullYear())) {
      newErrors.foundedYear = 'Рік має бути між 1800 та поточним';
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
      if (publisher) {
        await updatePublisher({ id: publisher.id, data: formData }).unwrap();
      } else {
        await createPublisher(formData).unwrap();
      }
      onClose();
    } catch (error: any) {
      alert(`Помилка: ${error.data?.message || 'Не вдалося зберегти видавництво'}`);
    }
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{publisher ? 'Редагувати видавництво' : 'Створити видавництво'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  Назва видавництва<span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Введіть назву видавництва"
                />
                {errors.name && <div className={styles.error}>{errors.name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>Опис</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Опис видавництва"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Рік заснування</label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear || ''}
                    onChange={handleChange}
                    placeholder="Наприклад: 1990"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                  {errors.foundedYear && <div className={styles.error}>{errors.foundedYear}</div>}
                </div>

                <div className={styles.formGroup}>
                  <label>Країна</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Наприклад: Україна"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Місто</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Наприклад: Київ"
                  />
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
                  {errors.website && <div className={styles.error}>{errors.website}</div>}
                </div>
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
              {isLoading ? 'Збереження...' : publisher ? 'Оновити' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}