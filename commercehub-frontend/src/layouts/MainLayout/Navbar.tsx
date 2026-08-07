import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Button,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { cartService } from '@/features/cart/services/cartService';
import { authService } from '@/features/authentication/services/authService';

export function Navbar() {
  const { isAuthenticated, isAdmin, isInitialized, logout } = useAuth();
  const { toggleTheme, themeMode } = useUiStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: cart } = useQuery({
    queryKey: QUERY_KEYS.CART.MY,
    queryFn: cartService.getCart,
    enabled: isAuthenticated && !isAdmin && isInitialized,
  });

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // ignore logout errors — clear local state regardless
      }
    }
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to={ROUTES.HOME}
          sx={{ fontWeight: 800, color: 'primary.main', textDecoration: 'none', flexGrow: 1 }}
        >
          CommerceHub
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          <Button component={RouterLink} to={ROUTES.PRODUCTS} color="inherit">
            Products
          </Button>
        </Box>

        <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton onClick={toggleTheme} color="inherit" size="small">
            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        {isAuthenticated ? (
          <>
            {!isAdmin && (
              <>
                <Tooltip title="Wishlist">
                  <IconButton
                    component={RouterLink}
                    to={ROUTES.WISHLIST}
                    color="inherit"
                    size="small"
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cart">
                  <IconButton
                    component={RouterLink}
                    to={ROUTES.CART}
                    color="inherit"
                    size="small"
                  >
                    <Badge badgeContent={cartCount} color="secondary">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </>
            )}

            {isAdmin && (
              <Tooltip title="Admin Panel">
                <IconButton
                  component={RouterLink}
                  to={ROUTES.ADMIN_DASHBOARD}
                  color="inherit"
                  size="small"
                >
                  <AdminPanelSettingsIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Account">
              <IconButton onClick={handleMenuOpen} color="inherit" size="small">
                <PersonIcon />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem
                onClick={() => { handleMenuClose(); navigate(ROUTES.PROFILE); }}
              >
                My Profile
              </MenuItem>
              <MenuItem
                onClick={() => { handleMenuClose(); navigate(ROUTES.ORDERS); }}
              >
                My Orders
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button component={RouterLink} to={ROUTES.LOGIN} variant="outlined" size="small">
              Login
            </Button>
            <Button
              component={RouterLink}
              to={ROUTES.REGISTER}
              variant="contained"
              size="small"
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
