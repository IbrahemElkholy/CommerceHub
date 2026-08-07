package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummaryResponse(
        UUID id,
        OrderStatus status,
        BigDecimal total,
        String currency,
        int itemCount,
        Instant createdAt
) {}
