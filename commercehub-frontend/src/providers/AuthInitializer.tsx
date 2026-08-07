import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setAccessToken } from '@/api/client';
import { authService } from '@/features/authentication/services/authService';

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { isAuthenticated, refreshToken, setAuth, clearAuth, setInitialized, user } =
    useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      if (isAuthenticated && refreshToken && user) {
        try {
          const authResponse = await authService.refresh({ refreshToken });
          setAccessToken(authResponse.accessToken);
          setAuth(user, authResponse.accessToken, authResponse.refreshToken);
        } catch {
          setAccessToken(null);
          clearAuth();
        }
      }
      setInitialized();
    };

    initialize();
  }, []);

  return <>{children}</>;
}
