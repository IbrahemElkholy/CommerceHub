import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  OrderFilterParams,
  OrderResponse,
  OrderSummaryResponse,
  PlaceOrderRequest,
  UpdateOrderStatusRequest,
} from '../types';

export const orderService = {
  placeOrder: async (data: PlaceOrderRequest): Promise<OrderResponse> => {
    const idempotencyKey = uuidv4();
    const response = await apiClient.post<ApiResponse<OrderResponse>>('/orders', data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return response.data.data;
  },

  getMyOrders: async (
    params: OrderFilterParams,
  ): Promise<PaginatedResponse<OrderSummaryResponse>> => {
    const response = await apiClient.get<PaginatedResponse<OrderSummaryResponse>>(
      '/orders/me',
      { params },
    );
    return response.data;
  },

  getOrderById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/me/${id}`);
    return response.data.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<void> => {
    await apiClient.delete<void>(`/orders/me/${id}`, {
      params: reason ? { reason } : undefined,
    });
  },

  getAdminOrderById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
    return response.data.data;
  },

  getAdminOrders: async (
    params: OrderFilterParams,
  ): Promise<PaginatedResponse<OrderSummaryResponse>> => {
    const response = await apiClient.get<PaginatedResponse<OrderSummaryResponse>>(
      '/orders',
      { params },
    );
    return response.data;
  },

  updateOrderStatus: async (
    id: string,
    data: UpdateOrderStatusRequest,
  ): Promise<OrderResponse> => {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(
      `/orders/${id}/status`,
      data,
    );
    return response.data.data;
  },

};
