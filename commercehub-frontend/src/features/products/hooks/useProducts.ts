import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productService } from '../services/productService';
import type { ProductFilterParams } from '../types';

export function useProducts(params: ProductFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.LIST(params as Record<string, unknown>),
    queryFn: () => productService.listProducts(params),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.DETAIL(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES.TREE,
    queryFn: productService.getCategoryTree,
    staleTime: 10 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: QUERY_KEYS.BRANDS.ALL,
    queryFn: productService.getBrands,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProductReviews(productId: string, params: { page?: number; size?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.REVIEWS(productId),
    queryFn: () => productService.getProductReviews(productId, params),
    enabled: !!productId,
  });
}
