package com.commercehub.analytics.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AnalyticsEventResponse(
        UUID id,
        String eventType,
        UUID userId,
        UUID entityId,
        String entityType,
        Map<String, Object> metadata,
        Instant createdAt
) {}
