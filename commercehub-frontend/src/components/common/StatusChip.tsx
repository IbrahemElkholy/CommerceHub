import { Chip, type ChipProps } from '@mui/material';
import { formatOrderStatus } from '@/utils/formatters';
import { ORDER_STATUS_COLORS } from '@/utils/orderStatus';
import type { OrderStatus } from '@/features/orders/types';

interface StatusChipProps {
  status: OrderStatus;
  size?: ChipProps['size'];
}

export function StatusChip({ status, size = 'small' }: StatusChipProps) {
  return (
    <Chip
      label={formatOrderStatus(status)}
      color={ORDER_STATUS_COLORS[status]}
      size={size}
      variant="filled"
    />
  );
}
