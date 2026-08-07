import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  CancelOrderRequest,
  OrderFilterParams,
  OrderResponse,
  OrderStatusHistoryResponse,
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
    const response = await apiClient.get<PaginatedResponse<OrderSummaryResponse>>('/orders', {
      params,
    });
    return response.data;
  },

  getOrderById: async (id: string): Promise<OrderResponse> => {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
    return response.data.data;
  },

  cancelOrder: async (id: string, data: CancelOrderRequest): Promise<OrderResponse> => {
    const response = await apiClient.post<ApiResponse<OrderResponse>>(
      `/orders/${id}/cancel`,
      data,
    );
    return response.data.data;
  },

  getAdminOrders: async (
    params: OrderFilterParams,
  ): Promise<PaginatedResponse<OrderSummaryResponse>> => {
    const response = await apiClient.get<PaginatedResponse<OrderSummaryResponse>>(
      '/orders/admin',
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

  getOrderHistory: async (id: string): Promise<OrderStatusHistoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<OrderStatusHistoryResponse[]>>(
      `/orders/${id}/history`,
    );
    return response.data.data;
  },
};
