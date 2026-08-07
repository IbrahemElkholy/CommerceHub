package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        OrderStatus status,
        List<OrderItemResponse> items,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal shippingAmount,
        BigDecimal total,
        String currency,
        ShippingAddressDto shippingAddress,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        List<OrderStatusHistoryResponse> statusHistory
) {}
