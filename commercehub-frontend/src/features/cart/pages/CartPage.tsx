import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Divider,
  TextField,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Helmet } from 'react-helmet-async';
import { useCart, useCartMutations } from '../hooks/useCart';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ROUTES } from '@/constants/routes';

export function CartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { updateItem, removeItem, clearCart, applyCoupon, removeCoupon } = useCartMutations();
  const [couponInput, setCouponInput] = useState('');

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Shopping Cart</Typography>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState onRetry={refetch} />
      </Container>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Helmet><title>Cart — CommerceHub</title></Helmet>
        <EmptyState
          title="Your cart is empty"
          description="Browse our products and add something you like."
          action={{ label: 'Browse Products', onClick: () => navigate(ROUTES.PRODUCTS) }}
        />
      </Container>
    );
  }

  const handleApplyCoupon = () => {
    if (couponInput.trim()) {
      applyCoupon.mutate({ couponCode: couponInput.trim() });
    }
  };

  return (
    <>
      <Helmet><title>Cart — CommerceHub</title></Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Shopping Cart
            <Typography component="span" variant="body1" sx={{ color: 'text.secondary', ml: 1 }}>
              ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
            </Typography>
          </Typography>
          <Button
            variant="text"
            color="error"
            onClick={() => clearCart.mutate()}
            disabled={clearCart.isPending}
            size="small"
          >
            Clear Cart
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {cart.items.map((item) => (
              <Card key={item.productId} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box
                      component="img"
                      src={item.productImageUrl ?? '/placeholder-product.png'}
                      alt={item.productName}
                      sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.productName}
                      </Typography>
                      <PriceDisplay amount={item.unitPrice} variant="body2" color="text.secondary" />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateItem.mutate({
                            productId: item.productId,
                            data: { quantity: item.quantity - 1 },
                          })
                        }
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        aria-label="Decrease quantity"
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 28, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          updateItem.mutate({
                            productId: item.productId,
                            data: { quantity: item.quantity + 1 },
                          })
                        }
                        disabled={item.quantity >= 100 || updateItem.isPending}
                        aria-label="Increase quantity"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <PriceDisplay amount={item.lineTotal} variant="subtitle1" fontWeight={700} />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem.mutate(item.productId)}
                        disabled={removeItem.isPending}
                        aria-label="Remove item"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Order Summary
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                  <PriceDisplay amount={cart.subtotal} variant="body2" />
                </Box>

                {cart.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'success.main' }}>Discount</Typography>
                    <PriceDisplay amount={-cart.discountAmount} variant="body2" color="success.main" />
                  </Box>
                )}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                  <PriceDisplay amount={cart.totalAfterDiscount} variant="subtitle1" fontWeight={700} color="primary.main" />
                </Box>

                {cart.couponCode ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 600 }}>
                      Coupon: {cart.couponCode}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeCoupon.mutate()}
                      disabled={removeCoupon.isPending}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      onClick={handleApplyCoupon}
                      disabled={applyCoupon.isPending || !couponInput.trim()}
                    >
                      {applyCoupon.isPending ? <CircularProgress size={18} /> : 'Apply'}
                    </Button>
                  </Box>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate(ROUTES.CHECKOUT)}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
