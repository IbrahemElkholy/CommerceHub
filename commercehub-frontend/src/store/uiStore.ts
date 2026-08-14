import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface SnackbarMessage {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface UiState {
  themeMode: ThemeMode;
  snackbars: SnackbarMessage[];

  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  showSnackbar: (message: string, severity?: SnackbarMessage['severity']) => void;
  dismissSnackbar: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      snackbars: [],

      toggleTheme: () =>
        set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),

      setTheme: (mode) => set({ themeMode: mode }),

      showSnackbar: (message, severity = 'info') =>
        set((state) => ({
          snackbars: [
            ...state.snackbars,
            { id: `${Date.now()}-${Math.random()}`, message, severity },
          ],
        })),

      dismissSnackbar: (id) =>
        set((state) => ({
          snackbars: state.snackbars.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ themeMode: state.themeMode }),
    },
  ),
);
