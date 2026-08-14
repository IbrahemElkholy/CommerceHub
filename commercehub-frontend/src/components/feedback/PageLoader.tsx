import { Box, CircularProgress } from '@mui/material';

export function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress size={48} />
    </Box>
  );
}
