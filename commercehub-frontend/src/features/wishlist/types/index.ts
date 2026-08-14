import type { PaginatedData } from '@/types/api';
import type { ProductSummaryResponse } from '@/features/products/types';

export interface WishlistItemResponse {
  productId: string;
  product: ProductSummaryResponse;
  createdAt: string;
}

export type WishlistResponse = PaginatedData<WishlistItemResponse>;
