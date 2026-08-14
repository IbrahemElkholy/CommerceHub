import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '@/api/client';
import type { UserResponse } from '@/features/authentication/types';

interface AuthState {
  user: UserResponse | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuth: (user: UserResponse, accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,

      setAuth: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, refreshToken, isAuthenticated: true, isInitialized: true });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        set({ user: null, refreshToken: null, isAuthenticated: false });
      },

      setInitialized: () => set({ isInitialized: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
