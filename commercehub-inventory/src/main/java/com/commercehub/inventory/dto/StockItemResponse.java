package com.commercehub.inventory.dto;

import java.util.UUID;

public record StockItemResponse(
        UUID id,
        UUID productId,
        UUID warehouseId,
        String warehouseName,
        int quantityOnHand,
        int quantityReserved,
        int quantityAvailable,
        int lowStockThreshold
) {}
