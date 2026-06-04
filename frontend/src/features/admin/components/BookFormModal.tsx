import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { 
  useCreateBookMutation, 
  useUpdateBookMutation, 
  useUploadBookCoverMutation,
  CreateBookInput,
  useGetAllAuthorsQuery,
  useGetAllGenresQuery,
  useGetAllPublishersQuery
} from '../adminApi';
import { useGetBookByIdQuery } from '../../../features/books/booksApi';
import { getImageUrl } from '../../../utils/getImageUrl';
import styles from './BookFormModal.module.css';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  book?: any;
}

export function BookFormModal({ isOpen, onClose, book }: BookFormModalProps) {
  const [createBook, { isLoading: isCreating }] = useCreateBookMutation();
  const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();
  const [uploadBookCover, { isLoading: isUploading }] = useUploadBookCoverMutation();

    const { data: authorsList } = useGetAllAuthorsQuery({ page: 1, limit: 1000 }, { skip: !isOpen });
  const { data: genresList } = useGetAllGenresQuery({ page: 1, limit: 1000 }, { skip: !isOpen });
  const { data: publishersList } = useGetAllPublishersQuery({ page: 1, limit: 1000 }, { skip: !isOpen });

  const { data: fullBookData, isLoading: isLoadingBook } = useGetBookByIdQuery(book?.id, {
    skip: !book?.id || !isOpen,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateBookInput>({
    title: '',
    description: '',
    plot: '',
    isbn: '',
    pageCount: undefined,
    languages: [],
    ageRestriction: undefined,
    isBestseller: false,
    authorIds: [],
    genreIds: [],
    publisherId: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (book && fullBookData) {
      const bookDetails = fullBookData.data;
      setFormData({
        title: bookDetails.title || '',
        description: bookDetails.description || '',
        plot: bookDetails.plot || '',
        isbn: bookDetails.isbn || '',
        pageCount: bookDetails.pageCount || undefined,
        languages: bookDetails.languages || [],
        ageRestriction: bookDetails.ageRestriction || undefined,
        isBestseller: bookDetails.isBestseller || false,
        authorIds: bookDetails.authors?.map((a: any) => a.id) || [],
        genreIds: bookDetails.genres?.map((g: any) => g.id) || [],
        publisherId: bookDetails.publishers?.[0]?.id || undefined,
      });
      setCoverPreview(bookDetails.coverImage ? getImageUrl(bookDetails.coverImage, 'book') : null);
    } else if (!book) {
      setFormData({
        title: '',
        description: '',
        plot: '',
        isbn: '',
        pageCount: undefined,
        languages: [],
        ageRestriction: undefined,
        isBestseller: false,
        authorIds: [],
        genreIds: [],
        publisherId: undefined,
      });
      setCoverPreview(null);
    }
    setCoverFile(null);
    setErrors({});
  }, [book, fullBookData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'pageCount') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMultiSelectChange = (name: 'authorIds' | 'genreIds', id: string) => {
    setFormData(prev => {
      const currentIds = prev[name] || [];
      if (currentIds.includes(id)) {
        return { ...prev, [name]: currentIds.filter(item => item !== id) };
      } else {
        return { ...prev, [name]: [...currentIds, id] };
      }
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Назва книги обов\'язкова';
    if (formData.pageCount && formData.pageCount < 1) newErrors.pageCount = 'Кількість сторінок має бути більше 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let bookId: string;
      if (book) {
        await updateBook({ id: book.id, data: formData }).unwrap();
        bookId = book.id;
      } else {
        const result = await createBook(formData).unwrap();
        bookId = result.data.id;
      }

      if (coverFile) {
        await uploadBookCover({ id: bookId, file: coverFile }).unwrap();
      }

      onClose();
    } catch (error: any) {
      alert(`Помилка: ${error.data?.message || 'Не вдалося зберегти книгу'}`);
    }
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating || isLoadingBook || isUploading;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{book ? 'Редагувати книгу' : 'Створити книгу'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {isLoadingBook ? (
          <div className={styles.modalBody}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>Завантаження...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Обкладинка</label>
                  <div className={styles.coverUpload}>
                    {coverPreview && (
                      <img src={coverPreview} alt="Обкладинка" className={styles.coverPreview} />
                    )}
                    <button
                      type="button"
                      className={styles.uploadButton}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      {coverPreview ? 'Змінити обкладинку' : 'Завантажити обкладинку'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverChange}
                      style={{ display: 'none' }}
                    />
                    {coverFile && (
                      <span className={styles.coverFileName}>{coverFile.name}</span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Назва книги<span className={styles.required}>*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Назва" />
                  {errors.title && <div className={styles.error}>{errors.title}</div>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>ISBN (13 цифр)</label>
                    <input type="text" name="isbn" value={formData.isbn || ''} onChange={handleChange} placeholder="978..." maxLength={13} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Видавництво</label>
                    <select name="publisherId" value={formData.publisherId || ''} onChange={handleChange}>
                      <option value="">Оберіть видавництво</option>
                      {publishersList?.data?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Автори</label>
                  <div className={styles.multiSelectContainer}>
                    {authorsList?.data?.map((author: any) => (
                      <label key={author.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.authorIds?.includes(author.id)}
                          onChange={() => handleMultiSelectChange('authorIds', author.id)}
                        />
                        {author.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Жанри</label>
                  <div className={styles.multiSelectContainer}>
                    {genresList?.data?.map((genre: any) => (
                      <label key={genre.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.genreIds?.includes(genre.id)}
                          onChange={() => handleMultiSelectChange('genreIds', genre.id)}
                        />
                        {genre.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Опис</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Короткий опис" />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Кількість сторінок</label>
                    <input type="number" name="pageCount" value={formData.pageCount || ''} onChange={handleChange} min="1" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Вікове обмеження</label>
                    <select name="ageRestriction" value={formData.ageRestriction || ''} onChange={handleChange}>
                      <option value="">Не вказано</option>
                      {['0+', '6+', '12+', '16+', '18+'].map(age => <option key={age} value={age}>{age}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="isBestseller" checked={formData.isBestseller} onChange={handleChange} />
                    Бестселер
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={onClose}>Скасувати</button>
              <button type="submit" className={`${styles.button} ${styles.submitButton}`} disabled={isLoading}>
                {isLoading ? 'Збереження...' : book ? 'Оновити' : 'Створити'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
