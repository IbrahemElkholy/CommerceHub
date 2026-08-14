import { Box, Container, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
