package com.commercehub.inventory.dto;

import java.util.UUID;

public record StockReservationRequest(UUID productId, int quantity) {}
