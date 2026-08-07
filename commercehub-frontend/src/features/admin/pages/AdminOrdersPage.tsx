import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Helmet } from 'react-helmet-async';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatusChip } from '@/components/common/StatusChip';
import { useAdminOrders } from '@/features/orders/hooks/useOrders';
import { buildRoute, ROUTES } from '@/constants/routes';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { OrderSummaryResponse, OrderStatus } from '@/features/orders/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'CREATED', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const { data, isLoading } = useAdminOrders({
    page,
    size: 20,
    status: statusFilter || undefined,
  });

  const columns: Column<OrderSummaryResponse>[] = [
    { key: 'orderNumber', label: 'Order #', render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.orderNumber}</Typography> },
    { key: 'date', label: 'Date', render: (row) => formatDate(row.createdAt) },
    { key: 'items', label: 'Items', align: 'right', render: (row) => row.itemCount },
    { key: 'total', label: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
    { key: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <Tooltip title="View order">
          <IconButton
            size="small"
            onClick={() => navigate(buildRoute(ROUTES.ADMIN_ORDER_DETAIL, { id: row.id }))}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Orders — Admin</title></Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Orders</Typography>

        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(0); }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <DataTable
          columns={columns}
          rows={data?.data.content ?? []}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          totalElements={data?.data.totalElements}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="No orders found."
        />
      </Container>
    </>
  );
}
