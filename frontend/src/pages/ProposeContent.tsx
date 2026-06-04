import { useState, useRef } from 'react';
import { useProposeBookMutation, useProposeAuthorMutation } from '../features/proposals/proposalsApi';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Camera, Book, User, ArrowLeft } from 'lucide-react';
import styles from './ProposeContent.module.css';
import clsx from 'clsx';

export const ProposeContentPage = () => {
  const [type, setType] = useState<'book' | 'author'>('book');
  const [proposeBook, { isLoading: isBookLoading }] = useProposeBookMutation();
  const [proposeAuthor, { isLoading: isAuthorLoading }] = useProposeAuthorMutation();
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = (newType: 'book' | 'author') => {
    setType(newType);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBookSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileInputRef.current?.files?.[0];
    
    try {
      await proposeBook({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        publishedDate: fd.get('publishedDate') as string,
        isbn: fd.get('isbn') as string,
        pageCount: fd.get('pageCount') ? parseInt(fd.get('pageCount') as string) : undefined,
        file: file
      }).unwrap();
      alert('Дякуємо! Вашу пропозицію книги надіслано на модерацію.');
      navigate('/profile');
    } catch (err) {
      alert('Помилка при відправці пропозиції. Перевірте правильність заповнення полів.');
    }
  };

  const handleAuthorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fileInputRef.current?.files?.[0];
    
    try {
      await proposeAuthor({
        name: fd.get('name') as string,
        bio: fd.get('bio') as string,
        birthDate: fd.get('birthDate') as string,
        nationality: fd.get('nationality') as string,
        file: file
      }).unwrap();
      alert('Дякуємо! Пропозицію автора надіслано на модерацію.');
      navigate('/profile');
    } catch (err) {
      alert('Помилка при відправці пропозиції.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <h1>Додати контент</h1>
        </div>
        <p className={styles.subtitle}>Допоможіть нам розширити бібліотеку. Всі пропозиції проходять модерацію.</p>

        <div className={styles.typeSwitcher}>
          <button 
            className={clsx(styles.switchBtn, type === 'book' && styles.active)}
            onClick={() => resetForm('book')}
          >
            <Book size={18} /> Книгу
          </button>
          <button 
            className={clsx(styles.switchBtn, type === 'author' && styles.active)}
            onClick={() => resetForm('author')}
          >
            <User size={18} /> Автора
          </button>
        </div>

        <div className={styles.uploadSection}>
          <div className={styles.previewBox} onClick={() => fileInputRef.current?.click()}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className={styles.imagePreview} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <Camera size={32} />
                <span>Додати {type === 'book' ? 'обкладинку' : 'фото автора'}</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className={styles.hiddenInput} 
          />
        </div>

        {type === 'book' ? (
          <form onSubmit={handleBookSubmit} className={styles.form}>
            <TextField label="Назва книги" name="title" isRequired placeholder="Наприклад: Тіні забутих предків" />
            <div className={styles.formRow}>
              <TextField label="ISBN (13 цифр)" name="isbn" placeholder="978..." />
              <TextField label="Кількість сторінок" name="pageCount" type="number" />
            </div>
            <TextField label="Дата публікації" name="publishedDate" type="date" />
            <TextField label="Опис" name="description" multiline placeholder="Про що ця книга?" />
            <Button type="submit" isLoading={isBookLoading} className={styles.submitBtn}>
              Надіслати пропозицію
            </Button>
          </form>
        ) : (
          <form onSubmit={handleAuthorSubmit} className={styles.form}>
            <TextField label="Ім'я автора" name="name" isRequired placeholder="Михайло Коцюбинський" />
            <div className={styles.formRow}>
              <TextField label="Національність" name="nationality" placeholder="Українець" />
              <TextField label="Дата народження" name="birthDate" type="date" />
            </div>
            <TextField label="Біографія" name="bio" multiline placeholder="Короткі відомості про життя та творчість..." />
            <Button type="submit" isLoading={isAuthorLoading} className={styles.submitBtn}>
              Запропонувати автора
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
