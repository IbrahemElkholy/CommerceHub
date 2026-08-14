import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type {
  AddToCartRequest,
  ApplyCouponRequest,
  CartResponse,
  UpdateCartItemRequest,
} from '../types';

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get<ApiResponse<CartResponse>>('/cart');
    return response.data.data;
  },

  addItem: async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/items', data);
    return response.data.data;
  },

  updateItem: async (productId: string, data: UpdateCartItemRequest): Promise<CartResponse> => {
    const response = await apiClient.patch<ApiResponse<CartResponse>>(
      `/cart/items/${productId}`,
      data,
    );
    return response.data.data;
  },

  removeItem: async (productId: string): Promise<CartResponse> => {
    const response = await apiClient.delete<ApiResponse<CartResponse>>(
      `/cart/items/${productId}`,
    );
    return response.data.data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },

  applyCoupon: async (data: ApplyCouponRequest): Promise<CartResponse> => {
    const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/coupon', data);
    return response.data.data;
  },

  removeCoupon: async (): Promise<CartResponse> => {
    const response = await apiClient.delete<ApiResponse<CartResponse>>('/cart/coupon');
    return response.data.data;
  },
};
