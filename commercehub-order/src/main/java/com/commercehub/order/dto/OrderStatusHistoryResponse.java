package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public record OrderStatusHistoryResponse(OrderStatus status, String note, UUID changedBy, Instant createdAt) {}
