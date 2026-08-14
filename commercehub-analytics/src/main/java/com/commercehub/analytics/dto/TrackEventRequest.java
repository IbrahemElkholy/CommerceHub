package com.commercehub.analytics.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;
import java.util.UUID;

public record TrackEventRequest(
        @NotBlank String eventType,
        UUID entityId,
        String entityType,
        Map<String, Object> metadata
) {}
