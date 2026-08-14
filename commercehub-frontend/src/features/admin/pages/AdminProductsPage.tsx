import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SearchBox } from '@/components/common/SearchBox';
import { useProducts } from '@/features/products/hooks/useProducts';
import { productService } from '@/features/products/services/productService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES, buildRoute } from '@/constants/routes';
import { useUiStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/formatters';
import type { ProductSummaryResponse } from '@/features/products/types';

export function AdminProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading } = useProducts({
    page,
    size: 20,
    search: debouncedSearch || undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showSnackbar('Product deleted.', 'success');
    },
    onError: () => showSnackbar('Could not delete product.', 'error'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      productService.updateProductStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showSnackbar('Status updated.', 'success');
    },
    onError: () => showSnackbar('Could not update status.', 'error'),
  });

  const columns: Column<ProductSummaryResponse>[] = [
    {
      key: 'image',
      label: 'Image',
      width: 64,
      render: (row) => (
        <Box
          component="img"
          src={row.primaryImageUrl ?? '/placeholder-product.png'}
          alt={row.name}
          sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
        />
      ),
    },
    { key: 'sku', label: 'SKU', render: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{row.sku}</Typography> },
    { key: 'name', label: 'Name', render: (row) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography> },
    { key: 'brand', label: 'Brand', render: (row) => row.brandName ?? '—' },
    { key: 'price', label: 'Price', align: 'right', render: (row) => formatCurrency(row.price) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          color={row.status === 'ACTIVE' ? 'success' : 'default'}
          size="small"
          clickable
          onClick={() =>
            toggleStatusMutation.mutate({
              id: row.id,
              status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            })
          }
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(buildRoute(ROUTES.ADMIN_PRODUCTS_EDIT, { id: row.id }))}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => deleteMutation.mutate(row.id)}
              disabled={deleteMutation.isPending}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Products — Admin</title></Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Products</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.ADMIN_PRODUCTS_NEW)}
          >
            Add Product
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
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
          emptyMessage="No products found."
        />
      </Container>
    </>
  );
}
