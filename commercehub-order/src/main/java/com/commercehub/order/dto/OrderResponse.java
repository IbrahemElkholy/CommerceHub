package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        UUID customerId,
        OrderStatus status,
        List<OrderItemResponse> items,
        String shippingStreet,
        String shippingCity,
        String shippingState,
        String shippingPostalCode,
        String shippingCountryCode,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal shippingCost,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String appliedCoupon,
        List<OrderStatusHistoryResponse> statusHistory,
        Instant createdAt,
        Instant updatedAt
) {}
