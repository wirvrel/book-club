import { Navigate, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '../auth/authApi';

export const AdminGuard = () => {
  const { data: userData, isLoading, isError } = useGetMeQuery(undefined);

  if (isLoading) return <div>Перевірка прав доступу...</div>;

  const isAdmin = userData?.success && userData.data.role === 'admin';

  if (!isAdmin || isError) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
