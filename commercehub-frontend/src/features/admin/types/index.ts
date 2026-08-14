export interface WarehouseResponse {
  id: string;
  name: string;
  location: string;
}

export interface StockItemResponse {
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lowStockThreshold: number;
}

export interface StockAdjustmentRequest {
  productId: string;
  warehouseId: string;
  quantityDelta: number;
  reason: string;
}

export interface RevenueByDateResponse {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProductResponse {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface OrderStatusSummaryResponse {
  status: string;
  count: number;
}

export interface NewCustomersResponse {
  date: string;
  count: number;
}

export interface PromotionResponse {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FLASH_SALE';
  discountValue: number;
  minimumOrderAmount: number | null;
  maxUsageCount: number | null;
  usageCount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreatePromotionRequest {
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FLASH_SALE';
  discountValue: number;
  minimumOrderAmount?: number;
  maxUsageCount?: number;
  startDate: string;
  endDate: string;
}

export interface GenerateCouponsRequest {
  count: number;
  maxUsesPerCoupon?: number;
}

export interface InventoryAdjustmentRecord {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityDelta: number;
  reason: string;
  performedByUserId: string;
  performedAt: string;
}

export interface AnalyticsRevenueParams {
  from: string;
  to: string;
}

export interface TopProductsParams {
  limit?: number;
}
