import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Pagination,
  Skeleton,
  Divider,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useMyOrders } from '../hooks/useOrders';
import { StatusChip } from '@/components/common/StatusChip';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buildRoute, ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/formatters';

export function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = useMyOrders({ page, size: 10 });

  return (
    <>
      <Helmet><title>My Orders — CommerceHub</title></Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>My Orders</Typography>

        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
          ))
        ) : data?.data.content.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Place your first order to see it here."
            action={{ label: 'Browse Products', onClick: () => navigate(ROUTES.PRODUCTS) }}
          />
        ) : (
          <>
            {data?.data.content.map((order) => (
              <Card
                key={order.id}
                variant="outlined"
                sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                onClick={() => navigate(buildRoute(ROUTES.ORDER_DETAIL, { id: order.id }))}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <StatusChip status={order.status} />
                      <PriceDisplay amount={order.totalAmount} variant="subtitle1" fontWeight={700} />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(buildRoute(ROUTES.ORDER_DETAIL, { id: order.id })); }}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}

            {(data?.data.totalPages ?? 0) > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={data?.data.totalPages}
                  page={page + 1}
                  onChange={(_, p) => setPage(p - 1)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
}
