import type { OrderStatus } from '@/features/orders/types';

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CREATED: 'default',
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PROCESSING: 'info',
  PACKED: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'secondary',
};

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  'CREATED',
  'PENDING_PAYMENT',
  'PROCESSING',
];

export const isCancellable = (status: OrderStatus): boolean =>
  CANCELLABLE_STATUSES.includes(status);
