import { useLoaderData, Link, useSearchParams } from 'react-router-dom';
import { useGetBooksQuery } from '../features/books/booksApi';
import { useGetGenresQuery } from '../features/genres/genresApi';
import { getImageUrl } from '../utils/getImageUrl';
import { Skeleton } from '../components/ui/Skeleton';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Search, Filter, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Catalog.module.css';
import clsx from 'clsx';

const LANGUAGES = [
  { code: 'uk', name: 'Українська' },
  { code: 'en', name: 'Англійська' },
  { code: 'pl', name: 'Польська' },
  { code: 'de', name: 'Німецька' },
];

const AGE_RATINGS = ['0+', '6+', '12+', '16+', '18+'];

export const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const genreIds = searchParams.get('genreIds') || '';
  const sortBy = searchParams.get('sortBy') || 'created';
  const minYearParam = searchParams.get('minYear') || '';
  const maxYearParam = searchParams.get('maxYear') || '';
  const languages = searchParams.get('languages') || '';
  const ageRestriction = searchParams.get('ageRestriction') || '';

  const [localMinYear, setLocalMinYear] = useState(minYearParam);
  const [localMaxYear, setLocalMaxYear] = useState(maxYearParam);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalMinYear(minYearParam);
    setLocalMaxYear(maxYearParam);
    setLocalSearch(search);
  }, [minYearParam, maxYearParam, search]);

  const { data: booksData, isLoading, isFetching } = useGetBooksQuery({ 
    page, 
    search: search || undefined, 
    genreIds: genreIds || undefined, 
    sortBy,
    minYear: minYearParam ? parseInt(minYearParam) : undefined,
    maxYear: maxYearParam ? parseInt(maxYearParam) : undefined,
    languages: languages || undefined,
    ageRestriction: ageRestriction || undefined,
    limit: 20 
  });
  
  const { data: genresData } = useGetGenresQuery({ limit: 100 });

  const selectedGenres = genreIds ? genreIds.split(',') : [];
  const selectedLanguages = languages ? languages.split(',') : [];

  const updateParam = (key: string, value: string | undefined) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      if (key !== 'page') prev.set('page', '1');
      return prev;
    });
  };

  const applyYearFilter = () => {
    setSearchParams(prev => {
      if (localMinYear) prev.set('minYear', localMinYear);
      else prev.delete('minYear');
      if (localMaxYear) prev.set('maxYear', localMaxYear);
      else prev.delete('maxYear');
      prev.set('page', '1');
      return prev;
    });
    setIsMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', localSearch);
  };

  const toggleGenre = (id: string) => {
    const newGenres = selectedGenres.includes(id)
      ? selectedGenres.filter(g => g !== id)
      : [...selectedGenres, id];
    updateParam('genreIds', newGenres.join(','));
  };

  const toggleLanguage = (code: string) => {
    const newLangs = selectedLanguages.includes(code)
      ? selectedLanguages.filter(l => l !== code)
      : [...selectedLanguages, code];
    updateParam('languages', newLangs.join(','));
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setIsMobileFilterOpen(false);
  };

  const visibleGenres = showAllGenres ? genresData?.data : genresData?.data?.slice(0, 10);

  const FilterPanel = () => (
    <aside className={styles.filters}>
      <div className={styles.filterHeader}>
        <h2><Filter size={18} /> Фільтри</h2>
        <div className={styles.filterHeaderActions}>
          <button className={styles.clearBtn} onClick={clearFilters}>Скинути</button>
          <button className={styles.mobileCloseBtn} onClick={() => setIsMobileFilterOpen(false)}><X size={20} /></button>
        </div>
      </div>

      <section className={styles.filterSection}>
        <h3>Жанри</h3>
        <div className={styles.genreList}>
          {visibleGenres?.map((genre: any) => (
            <button
              key={genre.id}
              className={clsx(styles.genreTag, selectedGenres.includes(genre.id) && styles.genreActive)}
              onClick={() => toggleGenre(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>
        {genresData?.data?.length > 10 && (
          <button className={styles.showMore} onClick={() => setShowAllGenres(!showAllGenres)}>
            {showAllGenres ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAllGenres ? 'Згорнути' : 'Показати всі'}
          </button>
        )}
      </section>

      <section className={styles.filterSection}>
        <h3>Рік видання</h3>
        <div className={styles.rangeInputs}>
          <input 
            type="number" 
            placeholder="Від" 
            value={localMinYear}
            onChange={(e) => setLocalMinYear(e.target.value)}
            className={styles.smallInput}
          />
          <input 
            type="number" 
            placeholder="До" 
            value={localMaxYear}
            onChange={(e) => setLocalMaxYear(e.target.value)}
            className={styles.smallInput}
          />
        </div>
        <Button variant="outline" size="sm" onPress={applyYearFilter} style={{marginTop: 8, width: '100%'}}>
          Застосувати роки
        </Button>
      </section>

      <section className={styles.filterSection}>
        <h3>Мова</h3>
        <div className={styles.checkList}>
          {LANGUAGES.map(lang => (
            <label key={lang.code} className={styles.checkItem}>
              <input 
                type="checkbox" 
                checked={selectedLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
              />
              {lang.name}
            </label>
          ))}
        </div>
      </section>

      <section className={styles.filterSection}>
        <h3>Вік</h3>
        <div className={styles.ageList}>
          {AGE_RATINGS.map(age => (
            <button
              key={age}
              className={clsx(styles.ageBtn, ageRestriction === age && styles.ageActive)}
              onClick={() => updateParam('ageRestriction', ageRestriction === age ? undefined : age)}
            >
              {age}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.filterSection}>
        <h3>Сортування</h3>
        <select 
          value={sortBy} 
          onChange={(e) => updateParam('sortBy', e.target.value)}
          className={styles.select}
        >
          <option value="created">Новинки</option>
          <option value="rating">Найкращий рейтинг</option>
          <option value="title">За назвою (A-Z)</option>
          <option value="reviews">Найбільше відгуків</option>
        </select>
      </section>
      
      <div className={styles.mobileApplyWrapper}>
        <Button onPress={() => setIsMobileFilterOpen(false)} className={styles.mobileApplyBtn}>Показати результати</Button>
      </div>
    </aside>
  );

  return (
    <div className={styles.container}>
      <div className={clsx(styles.desktopFilters)}>
        <FilterPanel />
      </div>

      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div 
              className={styles.mobileOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <motion.div 
              className={styles.mobileFilterDrawer}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <FilterPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Каталог</h1>
          <div className={styles.headerActions}>
            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <TextField 
                placeholder="Пошук книг..." 
                value={localSearch} 
                onChange={(val) => setLocalSearch(val)}
                className={styles.searchInput}
              />
              <Button type="submit">
                <Search size={18} />
              </Button>
            </form>
            <Button 
              variant="outline" 
              className={styles.mobileFilterToggle}
              onPress={() => setIsMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={18} />
              Фільтри
            </Button>
          </div>
        </div>

        <div className={styles.grid}>
          {(isLoading || isFetching) ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height="280px" width="100%" />
                <div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5}}>
                   <Skeleton height="20px" width="80%" />
                   <Skeleton height="15px" width="40%" />
                </div>
              </div>
            ))
          ) : booksData?.data?.length ? (
            booksData.data.map((book: any) => (
              <Link key={book.id} to={`/books/${book.id}`} className={styles.card}>
                <div className={styles.coverWrapper}>
                  <img src={getImageUrl(book.coverImage, 'book')} alt={book.title} className={styles.cover} />
                </div>
                <div className={styles.info}>
                  <h3>{book.title}</h3>
                  <div className={styles.metaRow}>
                    <p className={styles.rating}>
                      ★ {book.averageRating !== undefined && book.averageRating !== null ? Number(book.averageRating).toFixed(1) : '0.0'}
                    </p>
                    {book.publishedYear && <span className={styles.year}>{book.publishedYear}</span>}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className={styles.empty}>Нічого не знайдено.</p>
          )}
        </div>

        {booksData?.meta?.totalPages > 1 && (
          <div className={styles.pagination}>
            {Array.from({ length: booksData.meta.totalPages }).map((_, i) => (
              <button
                key={i}
                className={clsx(styles.pageBtn, page === i + 1 && styles.pageActive)}
                onClick={() => updateParam('page', (i + 1).toString())}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
