package com.commercehub.cart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartResponse(
        UUID id,
        List<CartItemResponse> items,
        BigDecimal subtotal,
        String couponCode,
        BigDecimal discountAmount,
        BigDecimal totalAfterDiscount
) {}
