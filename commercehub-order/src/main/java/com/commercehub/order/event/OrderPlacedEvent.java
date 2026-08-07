package com.commercehub.order.event;

import java.util.UUID;

public record OrderPlacedEvent(UUID orderId, UUID userId) {}
