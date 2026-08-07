package com.commercehub.notifications.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, String type, String title, String message, boolean read, Instant createdAt) {}
