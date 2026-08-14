package com.commercehub.reviews.dto;

import com.commercehub.reviews.entity.ReviewStatus;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID productId,
        UUID userId,
        short rating,
        String title,
        String body,
        ReviewStatus status,
        Instant createdAt
) {}
