import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setAccessToken } from '@/api/client';
import { authService } from '@/features/authentication/services/authService';
import { userService } from '@/features/authentication/services/userService';

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { isAuthenticated, refreshToken, setAuth, clearAuth, setInitialized } =
    useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      if (isAuthenticated && refreshToken) {
        try {
          const authResponse = await authService.refresh({ refreshToken });
          setAccessToken(authResponse.accessToken);
          const freshUser = await userService.getMe(authResponse.accessToken);
          setAuth(freshUser, authResponse.accessToken, authResponse.refreshToken);
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
