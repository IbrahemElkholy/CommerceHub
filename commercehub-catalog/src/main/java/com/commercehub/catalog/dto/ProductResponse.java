package com.commercehub.catalog.dto;

import com.commercehub.catalog.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String name,
        String description,
        BigDecimal price,
        ProductStatus status,
        BrandResponse brand,
        Set<CategorySummaryResponse> categories,
        List<ProductImageResponse> images,
        Integer availableStock,
        Instant createdAt,
        Instant updatedAt
) {}
