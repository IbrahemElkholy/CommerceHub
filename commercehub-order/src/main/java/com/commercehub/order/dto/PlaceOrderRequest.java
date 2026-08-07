package com.commercehub.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
        @NotBlank String idempotencyKey,
        @NotNull @Valid ShippingAddressDto shippingAddress,
        String notes
) {}
