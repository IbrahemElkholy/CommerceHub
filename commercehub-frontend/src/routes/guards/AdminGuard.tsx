import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { PageLoader } from '@/components/feedback/PageLoader';

interface AdminGuardProps {
  children?: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isAdmin, isInitialized } = useAuth();

  if (!isInitialized) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  if (!isAdmin) return <Navigate to={ROUTES.HOME} replace />;

  return children ? <>{children}</> : <Outlet />;
}
