package com.commercehub.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record ProductImageRequest(
        @NotBlank String url,
        String altText,
        int sortOrder,
        boolean isPrimary
) {}
