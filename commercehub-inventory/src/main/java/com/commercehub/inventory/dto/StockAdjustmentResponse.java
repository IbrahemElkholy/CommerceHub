package com.commercehub.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record StockAdjustmentResponse(UUID id, int quantityDelta, String reason, UUID adjustedByUserId, Instant createdAt) {}
