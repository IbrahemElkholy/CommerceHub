import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  IconButton,
  Skeleton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlistService';
import { cartService } from '@/features/cart/services/cartService';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { buildRoute, ROUTES } from '@/constants/routes';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';

export function WishlistPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);

  const { isAuthenticated, isInitialized } = useAuth();

  const { data: wishlist, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.WISHLIST.MY,
    queryFn: wishlistService.getWishlist,
    enabled: isAuthenticated && isInitialized,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST.MY });
      showSnackbar('Removed from wishlist.', 'info');
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartService.addItem({ productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.MY });
      showSnackbar('Added to cart!', 'success');
    },
    onError: () => showSnackbar('Could not add to cart.', 'error'),
  });

  return (
    <>
      <Helmet><title>Wishlist — CommerceHub</title></Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>My Wishlist</Typography>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : wishlist?.content?.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            description="Save products you love and come back to them later."
            action={{ label: 'Browse Products', onClick: () => navigate(ROUTES.PRODUCTS) }}
          />
        ) : (
          <Grid container spacing={2}>
            {(wishlist?.content ?? []).map(({ productId, product }) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={productId}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height={200}
                    image={product?.primaryImageUrl ?? '/placeholder-product.png'}
                    alt={product?.name ?? 'Product'}
                    onClick={() => navigate(buildRoute(ROUTES.PRODUCT_DETAIL, { id: productId }))}
                    sx={{ cursor: 'pointer', objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => navigate(buildRoute(ROUTES.PRODUCT_DETAIL, { id: productId }))}
                    >
                      {product?.name ?? 'Unknown product'}
                    </Typography>
                    {product && (
                      <PriceDisplay amount={product.price} variant="h6" fontWeight={700} color="primary.main" />
                    )}
                  </CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Tooltip title="Add to cart">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => addToCartMutation.mutate(productId)}
                          disabled={addToCartMutation.isPending || product?.status === 'INACTIVE'}
                          aria-label="Add to cart"
                        >
                          <AddShoppingCartIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove from wishlist">
                      <IconButton
                        color="error"
                        onClick={() => removeMutation.mutate(productId)}
                        disabled={removeMutation.isPending}
                        aria-label="Remove from wishlist"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
