package com.commercehub.inventory.event;

import java.util.UUID;

public record LowStockEvent(UUID productId, UUID warehouseId, int currentAvailable, int threshold) {}
