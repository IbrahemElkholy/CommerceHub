package com.commercehub.shipping.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateShipmentRequest(
        @NotNull UUID orderId,
        String trackingNumber,
        String carrier,
        Instant estimatedAt
) {}
