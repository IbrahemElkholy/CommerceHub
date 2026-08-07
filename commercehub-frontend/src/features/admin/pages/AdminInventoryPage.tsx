import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DataTable, type Column } from '@/components/common/DataTable';
import { adminService } from '../services/adminService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUiStore } from '@/store/uiStore';
import type { StockItemResponse, StockAdjustmentRequest } from '../types';

export function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const [page, setPage] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItemResponse | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.INVENTORY.STOCK({ page }),
    queryFn: () => adminService.getStock({ page, size: 20 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    quantityDelta: number;
    reason: string;
  }>();

  const adjustMutation = useMutation({
    mutationFn: (formData: { quantityDelta: number; reason: string }) => {
      const payload: StockAdjustmentRequest = {
        productId: selectedStock!.productId,
        warehouseId: selectedStock!.warehouseId,
        quantityDelta: Number(formData.quantityDelta),
        reason: formData.reason,
      };
      return adminService.adjustStock(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY.STOCK({}) });
      showSnackbar('Stock adjusted!', 'success');
      setAdjustOpen(false);
      reset();
    },
    onError: () => showSnackbar('Could not adjust stock.', 'error'),
  });

  const columns: Column<StockItemResponse>[] = [
    { key: 'product', label: 'Product', render: (row) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.productName}</Typography> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => row.warehouseName },
    { key: 'onHand', label: 'On Hand', align: 'right', render: (row) => row.quantityOnHand },
    { key: 'reserved', label: 'Reserved', align: 'right', render: (row) => row.quantityReserved },
    {
      key: 'available',
      label: 'Available',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: row.quantityAvailable <= row.lowStockThreshold ? 'error.main' : 'inherit' }}
        >
          {row.quantityAvailable}
        </Typography>
      ),
    },
    {
      key: 'stockStatus',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.quantityAvailable <= row.lowStockThreshold ? 'Low Stock' : 'In Stock'}
          color={row.quantityAvailable <= row.lowStockThreshold ? 'error' : 'success'}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => { setSelectedStock(row); setAdjustOpen(true); reset(); }}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Inventory — Admin</title></Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Inventory</Typography>

        <DataTable
          columns={columns}
          rows={data?.data.content ?? []}
          keyExtractor={(row) => `${row.productId}-${row.warehouseId}`}
          loading={isLoading}
          totalElements={data?.data.totalElements}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="No stock records found."
        />
      </Container>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {selectedStock?.productName}</DialogTitle>
        <DialogContent>
          <TextField
            label="Quantity Delta (+ to add, - to remove)"
            type="number"
            fullWidth
            margin="dense"
            {...register('quantityDelta', { required: 'Required', valueAsNumber: true })}
            error={!!errors.quantityDelta}
            helperText={errors.quantityDelta?.message}
          />
          <TextField
            label="Reason"
            fullWidth
            margin="dense"
            {...register('reason', { required: 'Reason is required' })}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit((d) => adjustMutation.mutate(d))}
            disabled={adjustMutation.isPending}
          >
            {adjustMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Adjust'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
