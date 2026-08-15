import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Chip,
  Rating,
  Divider,
  Skeleton,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  Avatar,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProduct, useProductReviews } from '../hooks/useProducts';
import { cartService } from '@/features/cart/services/cartService';
import { wishlistService } from '@/features/wishlist/services/wishlistService';
import type { WishlistItemResponse } from '@/features/wishlist/types';
import { productService } from '../services/productService';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { formatDateTime } from '@/utils/formatters';
import { reviewSchema, type ReviewFormValues } from '@/validators/productValidators';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const { isAuthenticated, isAdmin } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState(0);

  const { data: product, isLoading, isError, refetch } = useProduct(id ?? '');
  const { data: reviewsData, isLoading: reviewsLoading } = useProductReviews(id ?? '', { page: 0, size: 10 });

  const { data: myReviewsData } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.MY_REVIEWS,
    queryFn: productService.getMyReviews,
    enabled: isAuthenticated && !isAdmin,
  });
  const myReviewForProduct = myReviewsData?.data.content?.find((r) => r.productId === id);

  const wishlistData = queryClient.getQueryData<{ items: { productId: string }[] }>(QUERY_KEYS.WISHLIST.MY);
  const isWishlisted = wishlistData?.items?.some((i) => i.productId === id) ?? false;

  const addToCartMutation = useMutation({
    mutationFn: () => cartService.addItem({ productId: id!, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.MY });
      showSnackbar('Added to cart!', 'success');
    },
    onError: () => showSnackbar('Could not add to cart.', 'error'),
  });

  const wishlistMutation = useMutation<WishlistItemResponse | void>({
    mutationFn: () =>
      isWishlisted ? wishlistService.removeFromWishlist(id!) : wishlistService.addToWishlist(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST.MY }),
    onError: () => showSnackbar('Could not update wishlist.', 'error'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema) });

  const reviewMutation = useMutation({
    mutationFn: (data: ReviewFormValues) => productService.submitReview(id!, data),
    onSuccess: () => {
      showSnackbar('Review submitted! It will appear after admin approval.', 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.REVIEWS(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.MY_REVIEWS });
      reset();
    },
    onError: () => showSnackbar('Could not submit review.', 'error'),
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" height={48} width="80%" />
            <Skeleton variant="text" height={32} width="40%" />
            <Skeleton variant="text" height={24} width="60%" />
            <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (isError || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message="Product not found." onRetry={refetch} />
      </Container>
    );
  }

  const images = product.images ?? [];
  const primaryImage = images[selectedImage] ?? images[0];

  return (
    <>
      <Helmet>
        <title>{`${product.name} — CommerceHub`}</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(ROUTES.PRODUCTS)}
          sx={{ mb: 3 }}
        >
          Back to Products
        </Button>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={primaryImage?.url ?? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23bdbdbd'%3E%F0%9F%9B%8D%3C/text%3E%3C/svg%3E"}
              alt={primaryImage?.altText ?? product.name}
              sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 480 }}
            />
            {images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.url}
                    alt={img.altText}
                    onClick={() => setSelectedImage(i)}
                    sx={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: i === selectedImage ? '2px solid' : '2px solid transparent',
                      borderColor: i === selectedImage ? 'primary.main' : 'transparent',
                    }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {product.brand && (
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                {product.brand.name}
              </Typography>
            )}
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}>
              {product.name}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {(product.categories ?? []).map((cat) => (
                <Chip key={cat.id} label={cat.name} size="small" variant="outlined" />
              ))}
            </Box>

            <PriceDisplay amount={product.price} variant="h4" fontWeight={800} color="primary.main" />

            <Box sx={{ my: 2 }}>
              {product.availableStock > 0 ? (
                <Chip label={`${product.availableStock} in stock`} color="success" size="small" />
              ) : (
                <Chip label="Out of Stock" color="error" size="small" />
              )}
            </Box>

            {product.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8 }}>
                {product.description}
              </Typography>
            )}

            {isAuthenticated && !isAdmin && product.status === 'ACTIVE' && product.availableStock > 0 && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    sx={{ minWidth: 32, px: 0 }}
                    aria-label="Decrease quantity"
                  >
                    −
                  </Button>
                  <Typography sx={{ width: 32, textAlign: 'center' }}>{quantity}</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setQuantity((q) => Math.min(product.availableStock, q + 1))}
                    sx={{ minWidth: 32, px: 0 }}
                    aria-label="Increase quantity"
                  >
                    +
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={addToCartMutation.isPending ? undefined : <AddShoppingCartIcon />}
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending || quantity > product.availableStock}
                  sx={{ flexGrow: 1 }}
                >
                  {addToCartMutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Add to Cart'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => wishlistMutation.mutate()}
                  disabled={wishlistMutation.isPending}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? <FavoriteIcon color="secondary" /> : <FavoriteBorderIcon />}
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {product.dimensions && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {product.dimensions.weightKg && `Weight: ${product.dimensions.weightKg} kg`}
                  {product.dimensions.lengthCm && ` · ${product.dimensions.lengthCm}×${product.dimensions.widthCm}×${product.dimensions.heightCm} cm`}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              SKU: {product.sku}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Product tabs">
            <Tab label="Reviews" />
          </Tabs>
          <Divider />

          {tab === 0 && (
            <Box sx={{ mt: 3 }}>
              {reviewsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="80%" />
                  </Box>
                ))
              ) : (reviewsData?.data.content?.length ?? 0) === 0 ? (
                <Typography sx={{ color: 'text.secondary' }}>No reviews yet.</Typography>
              ) : (
                (reviewsData?.data.content ?? []).map((review) => (
                  <Box key={review.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>U</Avatar>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDateTime(review.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{review.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{review.body}</Typography>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))
              )}

              {myReviewForProduct && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 2, bgcolor: 'warning.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Your Review</Typography>
                    <Chip label={myReviewForProduct.status === 'PENDING' ? 'Pending Approval' : myReviewForProduct.status} size="small" color={myReviewForProduct.status === 'APPROVED' ? 'success' : myReviewForProduct.status === 'REJECTED' ? 'error' : 'warning'} />
                  </Box>
                  <Rating value={myReviewForProduct.rating} readOnly size="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>{myReviewForProduct.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{myReviewForProduct.body}</Typography>
                </Box>
              )}

              {isAuthenticated && !isAdmin && !myReviewForProduct && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Write a Review
                  </Typography>
                  <Box
                    component="form"
                    onSubmit={handleSubmit((d) => reviewMutation.mutate(d))}
                    noValidate
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Rating *
                      </Typography>
                      <Controller
                        name="rating"
                        control={control}
                        render={({ field }) => (
                          <Rating
                            value={field.value ?? null}
                            onChange={(_, v) => field.onChange(v)}
                          />
                        )}
                      />
                      {errors.rating && (
                        <Typography variant="caption" sx={{ color: 'error.main' }}>
                          {errors.rating.message}
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      label="Title"
                      fullWidth
                      margin="dense"
                      {...register('title')}
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                    <TextField
                      label="Review"
                      fullWidth
                      multiline
                      rows={4}
                      margin="dense"
                      {...register('body')}
                      error={!!errors.body}
                      helperText={errors.body?.message}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ mt: 2 }}
                      disabled={reviewMutation.isPending}
                    >
                      {reviewMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
