import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import type { AddToCartRequest, ApplyCouponRequest, UpdateCartItemRequest } from '../types';

export function useCart() {
  const { isAuthenticated, isAdmin, isInitialized } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.CART.MY,
    queryFn: cartService.getCart,
    enabled: isAuthenticated && !isAdmin && isInitialized,
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.MY });

  const addItem = useMutation({
    mutationFn: (data: AddToCartRequest) => cartService.addItem(data),
    onSuccess: () => { invalidate(); showSnackbar('Added to cart!', 'success'); },
    onError: () => showSnackbar('Could not add item.', 'error'),
  });

  const updateItem = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: UpdateCartItemRequest }) =>
      cartService.updateItem(productId, data),
    onSuccess: invalidate,
    onError: () => showSnackbar('Could not update quantity.', 'error'),
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess: () => { invalidate(); showSnackbar('Item removed.', 'info'); },
    onError: () => showSnackbar('Could not remove item.', 'error'),
  });

  const clearCart = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => { invalidate(); showSnackbar('Cart cleared.', 'info'); },
    onError: () => showSnackbar('Could not clear cart.', 'error'),
  });

  const applyCoupon = useMutation({
    mutationFn: (data: ApplyCouponRequest) => cartService.applyCoupon(data),
    onSuccess: () => { invalidate(); showSnackbar('Coupon applied!', 'success'); },
    onError: () => showSnackbar('Invalid or expired coupon.', 'error'),
  });

  const removeCoupon = useMutation({
    mutationFn: cartService.removeCoupon,
    onSuccess: () => { invalidate(); showSnackbar('Coupon removed.', 'info'); },
    onError: () => showSnackbar('Could not remove coupon.', 'error'),
  });

  return { addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon };
}
