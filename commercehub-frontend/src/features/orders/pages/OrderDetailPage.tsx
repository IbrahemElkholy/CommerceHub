import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Skeleton,
  Step,
  Stepper,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOrder } from '../hooks/useOrders';
import { orderService } from '../services/orderService';
import { StatusChip } from '@/components/common/StatusChip';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { ErrorState } from '@/components/feedback/ErrorState';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/utils/formatters';
import { isCancellable } from '@/utils/orderStatus';
import { cancelOrderSchema, type CancelOrderFormValues } from '@/validators/orderValidators';
import { useUiStore } from '@/store/uiStore';

const ORDER_STEPS = ['CREATED', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: order, isLoading, isError, refetch } = useOrder(id ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CancelOrderFormValues>({ resolver: zodResolver(cancelOrderSchema) });

  const cancelMutation = useMutation({
    mutationFn: (data: CancelOrderFormValues) => orderService.cancelOrder(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.MY() });
      showSnackbar('Order cancelled.', 'info');
      setCancelOpen(false);
      reset();
    },
    onError: () => showSnackbar('Could not cancel order.', 'error'),
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={48} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message="Order not found." onRetry={refetch} />
      </Container>
    );
  }

  const activeStep = ORDER_STEPS.indexOf(order.status);

  return (
    <>
      <Helmet><title>Order {order.orderNumber} — CommerceHub</title></Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(ROUTES.ORDERS)} sx={{ mb: 3 }}>
          Back to Orders
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{order.orderNumber}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Placed on {formatDateTime(order.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <StatusChip status={order.status} size="medium" />
            {isCancellable(order.status) && (
              <Button variant="outlined" color="error" onClick={() => setCancelOpen(true)}>
                Cancel Order
              </Button>
            )}
          </Box>
        </Box>

        {activeStep >= 0 && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stepper activeStep={activeStep} alternativeLabel>
                {ORDER_STEPS.map((step) => (
                  <Step key={step}>
                    <StepLabel>{step.charAt(0) + step.slice(1).toLowerCase().replace('_', ' ')}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Items</Typography>
                {order.items.map((item, idx) => (
                  <Box key={item.productId}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.productName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          SKU: {item.sku} · Qty: {item.quantity} × {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}
                        </Typography>
                      </Box>
                      <PriceDisplay amount={item.lineTotal} variant="body1" fontWeight={600} />
                    </Box>
                    {idx < order.items.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Shipping Address</Typography>
                <Typography variant="body2">
                  {order.shippingStreet}<br />
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}<br />
                  {order.shippingCountryCode}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Payment Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                  <PriceDisplay amount={order.subtotal} variant="body2" />
                </Box>
                {order.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'success.main' }}>Discount</Typography>
                    <PriceDisplay amount={-order.discountAmount} variant="body2" color="success.main" />
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Shipping</Typography>
                  <PriceDisplay amount={order.shippingCost} variant="body2" />
                </Box>
                {order.taxAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tax</Typography>
                    <PriceDisplay amount={order.taxAmount} variant="body2" />
                  </Box>
                )}
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                  <PriceDisplay amount={order.totalAmount} variant="subtitle1" fontWeight={700} color="primary.main" />
                </Box>
                {order.appliedCoupon && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    Coupon applied: {order.appliedCoupon}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for cancellation"
            fullWidth
            multiline
            rows={3}
            margin="dense"
            {...register('reason')}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit((d) => cancelMutation.mutate(d))}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
