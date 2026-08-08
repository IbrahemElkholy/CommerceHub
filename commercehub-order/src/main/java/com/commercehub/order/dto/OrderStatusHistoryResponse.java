package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public record OrderStatusHistoryResponse(
        OrderStatus fromStatus,
        OrderStatus toStatus,
        String note,
        UUID changedByUserId,
        Instant changedAt
) {}
