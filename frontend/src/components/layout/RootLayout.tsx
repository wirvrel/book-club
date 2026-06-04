import { Outlet, Link, ScrollRestoration, useNavigate, useLocation } from 'react-router-dom';
import { useGetMeQuery, useLogoutMutation } from '../../features/auth/authApi';
import { LogOut, User, Menu, X, BookOpen, Search, Library, Layers, PlusSquare, BookMarked, Heart, Shield } from 'lucide-react';
import styles from './RootLayout.module.css';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RootLayout = () => {
  const hasToken = !!localStorage.getItem('accessToken');
  const { data: userData } = useGetMeQuery(undefined, { skip: !hasToken });
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout(undefined);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const user = userData?.data;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <BookMarked size={24} />
            </span>
            <span className={styles.logoText}>Book Club</span>
          </Link>
          
          <div className={styles.navLinks}>
            <Link to="/books" className={styles.navLink}><BookOpen size={18} /> Книги</Link>
            <Link to="/authors" className={styles.navLink}>Автори</Link>
            <Link to="/collections" className={styles.navLink}><Layers size={18} /> Підбірки</Link>
            <Link to="/search" className={styles.navLink}><Search size={18} /> Пошук</Link>
            
            {user ? (
              <>
                <Link to="/shelves" className={styles.navLink}><Library size={18} /> Полиці</Link>
                <Link to="/propose" className={styles.navLink} title="Запропонувати книгу або автора">
                  <PlusSquare size={18} />
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className={styles.adminLink} title="Адмін-панель">
                    <Shield size={18} /> Адмін
                  </Link>
                )}
                <div className={styles.userMenu}>
                  <Link to="/profile" className={styles.userLink}>
                    <User size={18} /> {user.username}
                  </Link>
                  <button onClick={handleLogout} className={styles.logoutBtn} title="Вийти">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.authLinks}>
                <Link to="/login" className={styles.loginBtn}>Вхід</Link>
                <Link to="/register" className={styles.registerBtn}>Реєстрація</Link>
              </div>
            )}
          </div>

          <button className={styles.mobileMenuBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Link to="/books">Книги</Link>
              <Link to="/authors">Автори</Link>
              <Link to="/collections">Підбірки</Link>
              <Link to="/search">Пошук</Link>
              {user ? (
                <>
                  <Link to="/shelves">Мої полиці</Link>
                  <Link to="/profile">Мій профіль</Link>
                  <Link to="/propose">Запропонувати книгу</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className={styles.mobileAdminLink}>
                      <Shield size={18} /> Адмін-панель
                    </Link>
                  )}
                  <button onClick={handleLogout} className={styles.mobileLogout}>Вийти</button>
                </>
              ) : (
                <>
                  <Link to="/login">Вхід</Link>
                  <Link to="/register">Реєстрація</Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>
              <span className={styles.footerLogoIcon}>
                <BookMarked size={20} />
              </span>
              Book Club
            </h3>
            <p>Ваша улюблена спільнота книголюбів. Місце, де книги оживають в обговореннях.</p>
          </div>
          <div className={styles.footerGrid}>
            <div className={styles.footerSection}>
              <h4>Платформа</h4>
              <Link to="/books">Каталог книг</Link>
              <Link to="/authors">Всі автори</Link>
              <Link to="/collections">Підбірки</Link>
            </div>
            <div className={styles.footerSection}>
              <h4>Користувачу</h4>
              <Link to="/search">Пошук друзів</Link>
              {user && <Link to="/propose">Запропонувати контент</Link>}
              {!user && <Link to="/login">Увійти</Link>}
            </div>
          </div>
        </div>
        <div className={styles.copyright}>
          <p>&copy; 2026 Book Club Platform. Зроблено з любов'ю до читання. <span className={styles.copyrightIcon}><Heart size={12} /></span></p>
        </div>
      </footer>

      <ScrollRestoration />
    </div>
  );
};
