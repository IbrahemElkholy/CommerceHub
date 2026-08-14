package com.commercehub.cart.service;

import com.commercehub.cart.dto.AddCartItemRequest;
import com.commercehub.cart.dto.CartResponse;
import com.commercehub.cart.dto.UpdateCartItemRequest;

import java.util.UUID;

public interface CartService {

    CartResponse getOrCreateCart(UUID userId);

    CartResponse addItem(UUID userId, AddCartItemRequest request);

    CartResponse updateItem(UUID userId, UUID productId, UpdateCartItemRequest request);

    CartResponse removeItem(UUID userId, UUID productId);

    CartResponse clearCart(UUID userId);

    CartResponse applyCoupon(UUID userId, String couponCode);

    CartResponse removeCoupon(UUID userId);
}
