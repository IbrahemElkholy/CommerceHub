package com.commercehub.catalog.dto;

import com.commercehub.catalog.entity.ProductStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponse(
        UUID id,
        String sku,
        String name,
        BigDecimal price,
        ProductStatus status,
        String primaryImageUrl,
        String brandName
) {}
