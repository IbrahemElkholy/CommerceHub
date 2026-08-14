package com.commercehub.order.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PlaceOrderRequest(
        @NotNull UUID shippingAddressId,
        String couponCode,
        String notes
) {}
