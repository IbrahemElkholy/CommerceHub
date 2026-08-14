package com.commercehub.cart.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(
        UUID id,
        UUID productId,
        String productName,
        String productImageUrl,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {}
