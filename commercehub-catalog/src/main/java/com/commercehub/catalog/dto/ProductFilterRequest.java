package com.commercehub.catalog.dto;

import com.commercehub.catalog.entity.ProductStatus;

import java.math.BigDecimal;

public record ProductFilterRequest(
        Long categoryId,
        Long brandId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String search,
        ProductStatus status
) {}
