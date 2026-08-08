import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { OrderFilterParams } from '../types';

export function useMyOrders(params: OrderFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.MY(params as Record<string, unknown>),
    queryFn: () => orderService.getMyOrders(params),
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
    queryFn: () => orderService.getAdminOrderById(id),
    enabled: !!id,
  });
}

export function useAdminOrders(params: OrderFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.ADMIN_LIST(params as Record<string, unknown>),
    queryFn: () => orderService.getAdminOrders(params),
    placeholderData: (prev) => prev,
  });
}
