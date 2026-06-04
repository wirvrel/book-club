import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateUserMutation, UpdateUserInput } from '../adminApi';
import styles from './BookFormModal.module.css';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export function UserFormModal({ isOpen, onClose, user }: UserFormModalProps) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  
  const [formData, setFormData] = useState<UpdateUserInput>({
    username: '',
    email: '',
    role: 'user',
    isPublic: true,
    bio: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'user',
        isPublic: user.isPublic !== undefined ? user.isPublic : true,
        bio: user.bio || '',
        location: user.location || '',
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username?.trim()) newErrors.username = 'Ім\'я користувача обов\'язкове';
    if (!formData.email?.trim()) newErrors.email = 'Email обов\'язковий';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateUser({ id: user.id, data: formData }).unwrap();
      onClose();
    } catch (error: any) {
      alert(`Помилка: ${error.data?.message || 'Не вдалося оновити користувача'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Редагувати користувача</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Ім'я користувача<span className={styles.required}>*</span></label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" />
                {errors.username && <div className={styles.error}>{errors.username}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>Email<span className={styles.required}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                {errors.email && <div className={styles.error}>{errors.email}</div>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Роль</label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="user">Користувач</option>
                    <option value="admin">Адміністратор</option>
                    <option value="banned">Заблокований</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Локація</label>
                  <input type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="Місто, країна" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Біографія</label>
                <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Про користувача" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} />
                  Публічний профіль
                </label>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={onClose}>Скасувати</button>
            <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={isLoading}>
              {isLoading ? 'Збереження...' : 'Оновити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
