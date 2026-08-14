import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import type { ReactNode } from 'react';
import { useUiStore } from '@/store/uiStore';
import { lightTheme, darkTheme } from '@/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useUiStore((state) => state.themeMode);
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
