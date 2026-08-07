export type CartStatus = 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';

export interface CartItemResponse {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartResponse {
  id: string;
  status: CartStatus;
  items: CartItemResponse[];
  subtotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
  couponCode: string | null;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  couponCode: string;
}
