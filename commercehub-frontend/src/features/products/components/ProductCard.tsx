import { Card, CardMedia, CardContent, CardActions, Typography, Box, Chip, IconButton, Tooltip, Skeleton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { motion } from 'framer-motion';
import { buildRoute, ROUTES } from '@/constants/routes';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { useAuth } from '@/hooks/useAuth';
import type { ProductSummaryResponse } from '../types';

interface ProductCardProps {
  product: ProductSummaryResponse;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  loading?: false;
}

interface ProductCardSkeletonProps {
  loading: true;
}

type Props = ProductCardProps | ProductCardSkeletonProps;

export function ProductCard(props: Props) {
  if ('loading' in props && props.loading) {
    return (
      <Card variant="outlined">
        <Skeleton variant="rectangular" height={220} />
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
        </CardContent>
      </Card>
    );
  }

  const { product, isWishlisted, onWishlistToggle, onAddToCart } = props as ProductCardProps;
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: 4 },
        }}
      >
        <CardMedia
          component={RouterLink}
          to={buildRoute(ROUTES.PRODUCT_DETAIL, { id: product.id })}
          sx={{ display: 'block', textDecoration: 'none' }}
        >
          <Box
            component="img"
            src={product.primaryImageUrl ?? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23bdbdbd'%3E🛍%3C/text%3E%3C/svg%3E"}
            alt={product.name}
            sx={{ width: '100%', height: 220, objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23bdbdbd'%3E🛍%3C/text%3E%3C/svg%3E";
            }}
          />
        </CardMedia>

        <CardContent sx={{ flexGrow: 1, pb: 0 }}>
          {product.brandName && (
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
              {product.brandName}
            </Typography>
          )}
          <Typography
            variant="subtitle1"
            component={RouterLink}
            to={buildRoute(ROUTES.PRODUCT_DETAIL, { id: product.id })}
            sx={{ fontWeight: 600, textDecoration: 'none', color: 'text.primary', display: 'block', mb: 0.5 }}
          >
            {product.name}
          </Typography>
          <PriceDisplay amount={product.price} variant="h6" fontWeight={700} color="primary.main" />
          {product.status === 'INACTIVE' && (
            <Chip label="Out of stock" color="error" size="small" sx={{ mt: 0.5 }} />
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, pt: 1, gap: 0.5 }}>
          {isAuthenticated && !isAdmin && (
            <>
              <Tooltip title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                <IconButton
                  size="small"
                  onClick={() => onWishlistToggle?.(product.id)}
                  color={isWishlisted ? 'secondary' : 'default'}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {product.status === 'ACTIVE' && (
                <Tooltip title="Add to cart">
                  <IconButton
                    size="small"
                    onClick={() => onAddToCart?.(product.id)}
                    color="primary"
                    aria-label="Add to cart"
                    sx={{ ml: 'auto' }}
                  >
                    <AddShoppingCartIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </CardActions>
      </Card>
    </motion.div>
  );
}
