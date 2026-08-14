package com.commercehub.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StockAdjustmentRequest(
        @NotNull UUID productId,
        @NotNull UUID warehouseId,
        @NotNull Integer quantityDelta,
        @NotBlank String reason
) {}
