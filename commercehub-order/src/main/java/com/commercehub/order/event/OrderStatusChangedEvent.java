package com.commercehub.order.event;

import com.commercehub.order.entity.OrderStatus;

import java.util.UUID;

public record OrderStatusChangedEvent(UUID orderId, UUID userId, OrderStatus oldStatus, OrderStatus newStatus) {}
