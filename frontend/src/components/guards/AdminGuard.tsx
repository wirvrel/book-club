import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMeQuery } from '../../features/auth/authApi';
import styles from './AdminGuard.module.css';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data, isLoading, error } = useGetMeQuery(undefined);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Перевірка прав доступу...</p>
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/login" replace />;
  }

  const user = data.data;

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
