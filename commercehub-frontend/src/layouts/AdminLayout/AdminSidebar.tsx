import { NavLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BarChartIcon from '@mui/icons-material/BarChart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { ROUTES } from '@/constants/routes';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Products', icon: <InventoryIcon />, to: ROUTES.ADMIN_PRODUCTS },
  { label: 'Categories', icon: <CategoryIcon />, to: ROUTES.ADMIN_CATEGORIES },
  { label: 'Orders', icon: <ShoppingBagIcon />, to: ROUTES.ADMIN_ORDERS },
  { label: 'Customers', icon: <PeopleIcon />, to: ROUTES.ADMIN_USERS },
  { label: 'Inventory', icon: <WarehouseIcon />, to: ROUTES.ADMIN_INVENTORY },
  { label: 'Analytics', icon: <BarChartIcon />, to: ROUTES.ADMIN_ANALYTICS },
  { label: 'Promotions', icon: <LocalOfferIcon />, to: ROUTES.ADMIN_PROMOTIONS },
];

export function AdminSidebar() {
  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
          CommerceHub
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Admin Panel
        </Typography>
      </Box>
      <Divider />
      <List dense sx={{ flexGrow: 1, pt: 1 }}>
        {navItems.map(({ label, icon, to }) => (
          <ListItem key={to} disablePadding>
            <ListItemButton
              component={NavLink}
              to={to}
              end={to === ROUTES.ADMIN_DASHBOARD}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.25,
                '&.active': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{icon}</ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { variant: 'body2' } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
