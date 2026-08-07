import { Snackbar as MuiSnackbar, Alert, Stack } from '@mui/material';
import { useUiStore } from '@/store/uiStore';

export function GlobalSnackbar() {
  const { snackbars, dismissSnackbar } = useUiStore();

  return (
    <Stack spacing={1} sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      {snackbars.map((snackbar) => (
        <MuiSnackbar
          key={snackbar.id}
          open
          autoHideDuration={5000}
          onClose={() => dismissSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => dismissSnackbar(snackbar.id)}
            variant="filled"
            elevation={6}
            sx={{ minWidth: 300 }}
          >
            {snackbar.message}
          </Alert>
        </MuiSnackbar>
      ))}
    </Stack>
  );
}
