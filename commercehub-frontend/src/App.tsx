import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthInitializer } from '@/providers/AuthInitializer';
import { GlobalSnackbar } from '@/components/feedback/Snackbar';
import { router } from '@/routes';

function App() {
  return (
    <HelmetProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthInitializer>
            <RouterProvider router={router} />
            <GlobalSnackbar />
          </AuthInitializer>
        </ThemeProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}

export default App;
