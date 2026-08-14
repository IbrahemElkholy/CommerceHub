package com.commercehub.inventory.service;

import com.commercehub.inventory.dto.StockReservationRequest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface InventoryService {

    void reserveStock(UUID orderId, List<StockReservationRequest> items);

    void releaseReservation(UUID orderId);

    void fulfillReservation(UUID orderId);

    boolean isStockAvailable(UUID productId, int quantity);

    int getAvailableStock(UUID productId);

    Map<UUID, Integer> getAvailableStock(List<UUID> productIds);
}
