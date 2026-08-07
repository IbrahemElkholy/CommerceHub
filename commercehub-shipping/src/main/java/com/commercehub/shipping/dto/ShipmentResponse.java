package com.commercehub.shipping.dto;

import com.commercehub.shipping.entity.ShipmentStatus;

import java.time.Instant;
import java.util.UUID;

public record ShipmentResponse(
        UUID id,
        UUID orderId,
        String trackingNumber,
        String carrier,
        ShipmentStatus status,
        Instant shippedAt,
        Instant deliveredAt,
        Instant estimatedAt,
        Instant createdAt
) {}
