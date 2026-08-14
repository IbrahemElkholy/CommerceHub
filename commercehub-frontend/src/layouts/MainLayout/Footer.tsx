import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 4, bgcolor: 'background.paper' }}>
      <Divider />
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }} gutterBottom>
              CommerceHub
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Your modern B2B/B2C commerce platform.
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              Shop
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link component={RouterLink} to={ROUTES.PRODUCTS} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Products
              </Link>
              <Link component={RouterLink} to={ROUTES.CART} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Cart
              </Link>
              <Link component={RouterLink} to={ROUTES.WISHLIST} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Wishlist
              </Link>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
              Account
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Link component={RouterLink} to={ROUTES.LOGIN} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Login
              </Link>
              <Link component={RouterLink} to={ROUTES.REGISTER} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Register
              </Link>
              <Link component={RouterLink} to={ROUTES.ORDERS} sx={{ color: 'text.secondary' }} variant="body2" underline="hover">
                Orders
              </Link>
            </Box>
          </Box>
        </Box>

        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            © {new Date().getFullYear()} CommerceHub. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
