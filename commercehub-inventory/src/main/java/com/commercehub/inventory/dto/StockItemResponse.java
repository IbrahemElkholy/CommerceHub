package com.commercehub.inventory.dto;

import java.util.UUID;

public record StockItemResponse(
        UUID id,
        UUID productId,
        String productName,
        UUID warehouseId,
        String warehouseName,
        int quantityOnHand,
        int quantityReserved,
        int quantityAvailable,
        int lowStockThreshold
) {}
