import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/features/cart/hooks/useCart';
import { orderService } from '../services/orderService';
import { userService } from '@/features/authentication/services/userService';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES, buildRoute } from '@/constants/routes';
import type { ApiErrorResponse } from '@/types/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const { data: cart } = useCart();

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS.ADDRESSES,
    queryFn: userService.getAddresses,
  });

  const { mutate: placeOrder, isPending, error } = useMutation({
    mutationFn: () => orderService.placeOrder({ shippingAddressId: selectedAddressId }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.MY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.MY() });
      navigate(buildRoute(ROUTES.ORDER_DETAIL, { id: order.id }));
    },
  });

  const apiError = error as ApiErrorResponse | null;

  const isStockError = apiError?.error?.code === 'INSUFFICIENT_STOCK';
  const stockProductId = isStockError
    ? apiError.error.message.match(/product:\s*([a-f0-9-]+)/i)?.[1] ?? null
    : null;
  const stockProduct = stockProductId
    ? cart?.items.find((item) => item.productId === stockProductId)
    : null;

  return (
    <>
      <Helmet><title>Checkout — CommerceHub</title></Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Checkout</Typography>

        {apiError?.error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              isStockError ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(ROUTES.CART)}
                >
                  Update Cart
                </Button>
              ) : undefined
            }
          >
            {isStockError
              ? `Not enough stock for ${stockProduct?.productName ?? 'this product'}. Please adjust the quantity in your cart.`
              : apiError.error.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Shipping Address
                </Typography>

                {addressesLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
                  ))
                ) : addresses?.length === 0 ? (
                  <Box>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      You have no saved addresses. Please add one to proceed.
                    </Alert>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(ROUTES.PROFILE_ADDRESSES)}
                    >
                      Add Address
                    </Button>
                  </Box>
                ) : (
                  <FormControl fullWidth>
                    <FormLabel sx={{ mb: 1 }}>Select an address</FormLabel>
                    <RadioGroup
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      {addresses?.map((addr) => (
                        <FormControlLabel
                          key={addr.id}
                          value={addr.id}
                          control={<Radio />}
                          label={
                            <Box>
                              {addr.label && (
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {addr.label}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {[
                                  addr.streetLine1,
                                  addr.streetLine2,
                                  addr.city,
                                  `${addr.state} ${addr.postalCode}`.trim(),
                                  addr.countryCode,
                                ]
                                  .filter((part): part is string => part !== null && part.trim().length > 0)
                                  .join(', ')}
                              </Typography>
                              {addr.isDefault && (
                                <Typography variant="caption" sx={{ color: 'primary.main' }}>
                                  Default
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{
                            border: '1px solid',
                            borderColor: selectedAddressId === addr.id ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            px: 1,
                            mb: 1,
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Order Summary
                </Typography>

                {cart?.items.map((item) => (
                  <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '60%' }} noWrap>
                      {item.productName} ×{item.quantity}
                    </Typography>
                    <PriceDisplay amount={item.lineTotal} variant="body2" />
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                  <PriceDisplay amount={cart?.subtotal ?? 0} variant="body2" />
                </Box>

                {(cart?.discountAmount ?? 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'success.main' }}>Discount</Typography>
                    <PriceDisplay amount={-(cart?.discountAmount ?? 0)} variant="body2" color="success.main" />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Shipping</Typography>
                  <Typography variant="body2" sx={{ color: 'success.main' }}>Free</Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                  <PriceDisplay amount={cart?.totalAfterDiscount ?? 0} variant="subtitle1" fontWeight={700} color="primary.main" />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isPending || !selectedAddressId}
                  onClick={() => placeOrder()}
                >
                  {isPending ? <CircularProgress size={22} color="inherit" /> : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
