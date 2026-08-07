package com.commercehub.order.dto;

import com.commercehub.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(@NotNull OrderStatus status, String note) {}
