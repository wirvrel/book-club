import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Book, PenTool, ArrowLeft, Building2, Tags } from 'lucide-react';
import clsx from 'clsx';
import styles from './AdminLayout.module.css';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
  { path: '/admin/proposals', icon: FileText, label: 'Пропозиції' },
  { path: '/admin/users', icon: Users, label: 'Користувачі' },
  { path: '/admin/books', icon: Book, label: 'Книги' },
  { path: '/admin/authors', icon: PenTool, label: 'Автори' },
  { path: '/admin/publishers', icon: Building2, label: 'Видавництва' },
  { path: '/admin/genres', icon: Tags, label: 'Жанри' },
];

export const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Адмін-панель</h2>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(styles.navItem, location.pathname === item.path && styles.active)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>На головну</span>
          </Link>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};
