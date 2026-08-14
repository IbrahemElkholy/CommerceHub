import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { WishlistItemResponse, WishlistResponse } from '../types';

export const wishlistService = {
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await apiClient.get<PaginatedResponse<WishlistItemResponse>>('/wishlist');
    return response.data.data;
  },

  addToWishlist: async (productId: string): Promise<WishlistItemResponse> => {
    const response = await apiClient.post<ApiResponse<WishlistItemResponse>>(`/wishlist/${productId}`);
    return response.data.data;
  },

  removeFromWishlist: async (productId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },
};
