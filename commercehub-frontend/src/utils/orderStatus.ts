import type { OrderStatus } from '@/features/orders/types';

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'secondary',
};

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
];

export const isCancellable = (status: OrderStatus): boolean =>
  CANCELLABLE_STATUSES.includes(status);
