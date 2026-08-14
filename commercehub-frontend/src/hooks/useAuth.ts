import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/features/authentication/types';

export function useAuth() {
  const { user, isAuthenticated, isInitialized, clearAuth } = useAuthStore();

  const hasRole = (role: UserRole): boolean => user?.roles.includes(role) ?? false;
  const hasAnyRole = (...roles: UserRole[]): boolean =>
    roles.some((role) => user?.roles.includes(role)) ?? false;

  const isAdmin = hasRole('ADMIN') || hasRole('SYSTEM_ADMIN');
  const isCustomer = hasRole('CUSTOMER');
  const isWarehouse = hasRole('WAREHOUSE');
  const isSupport = hasRole('SUPPORT');

  return {
    user,
    isAuthenticated,
    isInitialized,
    isAdmin,
    isCustomer,
    isWarehouse,
    isSupport,
    hasRole,
    hasAnyRole,
    logout: clearAuth,
  };
}
