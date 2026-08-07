import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  AnalyticsRevenueParams,
  CreatePromotionRequest,
  GenerateCouponsRequest,
  InventoryAdjustmentRecord,
  NewCustomersResponse,
  OrderStatusSummaryResponse,
  PromotionResponse,
  RevenueByDateResponse,
  StockAdjustmentRequest,
  StockItemResponse,
  TopProductResponse,
  TopProductsParams,
  WarehouseResponse,
} from '../types';

export const adminService = {
  getWarehouses: async (): Promise<WarehouseResponse[]> => {
    const response = await apiClient.get<ApiResponse<WarehouseResponse[]>>(
      '/inventory/warehouses',
    );
    return response.data.data;
  },

  getStock: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<StockItemResponse>> => {
    const response = await apiClient.get<PaginatedResponse<StockItemResponse>>(
      '/inventory/stock',
      { params },
    );
    return response.data;
  },

  getStockByProduct: async (productId: string): Promise<StockItemResponse[]> => {
    const response = await apiClient.get<ApiResponse<StockItemResponse[]>>(
      `/inventory/stock/${productId}`,
    );
    return response.data.data;
  },

  adjustStock: async (data: StockAdjustmentRequest): Promise<void> => {
    await apiClient.post('/inventory/stock/adjust', data);
  },

  getLowStock: async (): Promise<StockItemResponse[]> => {
    const response = await apiClient.get<ApiResponse<StockItemResponse[]>>(
      '/inventory/stock/low',
    );
    return response.data.data;
  },

  getAdjustments: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<InventoryAdjustmentRecord>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryAdjustmentRecord>>(
      '/inventory/adjustments',
      { params },
    );
    return response.data;
  },

  getRevenue: async (params: AnalyticsRevenueParams): Promise<RevenueByDateResponse[]> => {
    const response = await apiClient.get<ApiResponse<RevenueByDateResponse[]>>(
      '/analytics/revenue',
      { params },
    );
    return response.data.data;
  },

  getTopProducts: async (params: TopProductsParams): Promise<TopProductResponse[]> => {
    const response = await apiClient.get<ApiResponse<TopProductResponse[]>>(
      '/analytics/products/top-selling',
      { params },
    );
    return response.data.data;
  },

  getOrdersSummary: async (): Promise<OrderStatusSummaryResponse[]> => {
    const response = await apiClient.get<ApiResponse<OrderStatusSummaryResponse[]>>(
      '/analytics/orders/summary',
    );
    return response.data.data;
  },

  getNewCustomers: async (
    params: AnalyticsRevenueParams,
  ): Promise<NewCustomersResponse[]> => {
    const response = await apiClient.get<ApiResponse<NewCustomersResponse[]>>(
      '/analytics/customers/new',
      { params },
    );
    return response.data.data;
  },

  getPromotions: async (params: {
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<PromotionResponse>> => {
    const response = await apiClient.get<PaginatedResponse<PromotionResponse>>('/promotions', {
      params,
    });
    return response.data;
  },

  createPromotion: async (data: CreatePromotionRequest): Promise<PromotionResponse> => {
    const response = await apiClient.post<ApiResponse<PromotionResponse>>('/promotions', data);
    return response.data.data;
  },

  updatePromotionStatus: async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<PromotionResponse> => {
    const response = await apiClient.patch<ApiResponse<PromotionResponse>>(
      `/promotions/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  generateCoupons: async (promotionId: string, data: GenerateCouponsRequest): Promise<void> => {
    await apiClient.post(`/promotions/${promotionId}/coupons`, data);
  },
};
