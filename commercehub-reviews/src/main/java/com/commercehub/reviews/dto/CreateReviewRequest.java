package com.commercehub.reviews.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateReviewRequest(
        @NotNull UUID productId,
        UUID orderId,
        @Min(1) @Max(5) short rating,
        String title,
        String body
) {}
