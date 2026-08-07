export type OrderStatus =
  | 'CREATED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemResponse {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusHistoryResponse {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: string | null;
  note: string | null;
  changedAt: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountryCode: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  appliedCoupon: string | null;
  statusHistory: OrderStatusHistoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummaryResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface PlaceOrderRequest {
  shippingAddressId: string;
  couponCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface OrderFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: OrderStatus;
  customerId?: string;
  from?: string;
  to?: string;
}
