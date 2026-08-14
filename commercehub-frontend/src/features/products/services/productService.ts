import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedData, PaginatedResponse } from '@/types/api';
import type {
  BrandResponse,
  CategoryResponse,
  CreateBrandRequest,
  CreateCategoryRequest,
  CreateProductRequest,
  CreateReviewRequest,
  ProductFilterParams,
  ProductResponse,
  ProductSummaryResponse,
  ReviewResponse,
  UpdateCategoryRequest,
  UpdateProductRequest,
  UpdateProductStatusRequest,
} from '../types';

export const productService = {
  listProducts: async (
    params: ProductFilterParams,
  ): Promise<PaginatedResponse<ProductSummaryResponse>> => {
    const response = await apiClient.get<PaginatedResponse<ProductSummaryResponse>>(
      '/catalog/products',
      { params },
    );
    return response.data;
  },

  getProductById: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.get<ApiResponse<ProductResponse>>(
      `/catalog/products/${id}`,
    );
    return response.data.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<ProductResponse> => {
    const response = await apiClient.post<ApiResponse<ProductResponse>>(
      '/catalog/products',
      data,
    );
    return response.data.data;
  },

  updateProduct: async (id: string, data: UpdateProductRequest): Promise<ProductResponse> => {
    const response = await apiClient.put<ApiResponse<ProductResponse>>(
      `/catalog/products/${id}`,
      data,
    );
    return response.data.data;
  },

  updateProductStatus: async (
    id: string,
    data: UpdateProductStatusRequest,
  ): Promise<ProductResponse> => {
    const response = await apiClient.patch<ApiResponse<ProductResponse>>(
      `/catalog/products/${id}/status`,
      data,
    );
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/catalog/products/${id}`);
  },

  getCategoryTree: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/catalog/categories');
    return response.data.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.post<ApiResponse<CategoryResponse>>(
      '/catalog/categories',
      data,
    );
    return response.data.data;
  },

  updateCategory: async (id: number, data: UpdateCategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(
      `/catalog/categories/${id}`,
      data,
    );
    return response.data.data;
  },

  getBrands: async (): Promise<BrandResponse[]> => {
    const response = await apiClient.get<ApiResponse<PaginatedData<BrandResponse>>>('/catalog/brands', { params: { size: 200 } });
    return response.data.data.content;
  },

  createBrand: async (data: CreateBrandRequest): Promise<BrandResponse> => {
    const response = await apiClient.post<ApiResponse<BrandResponse>>('/catalog/brands', data);
    return response.data.data;
  },

  getProductReviews: async (
    productId: string,
    params: { page?: number; size?: number },
  ): Promise<PaginatedResponse<ReviewResponse>> => {
    const response = await apiClient.get<PaginatedResponse<ReviewResponse>>(
      `/reviews/products/${productId}`,
      { params },
    );
    return response.data;
  },

  getMyReviews: async (): Promise<PaginatedResponse<ReviewResponse>> => {
    const response = await apiClient.get<PaginatedResponse<ReviewResponse>>('/reviews/me', { params: { size: 100 } });
    return response.data;
  },

  submitReview: async (productId: string, data: CreateReviewRequest): Promise<ReviewResponse> => {
    const response = await apiClient.post<ApiResponse<ReviewResponse>>(
      '/reviews',
      { ...data, productId },
    );
    return response.data.data;
  },

  updateReviewStatus: async (
    reviewId: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<ReviewResponse> => {
    const response = await apiClient.patch<ApiResponse<ReviewResponse>>(
      `/reviews/${reviewId}/moderate`,
      null,
      { params: { status } },
    );
    return response.data.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },
};
