package com.commercehub.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record UpdateProductRequest(
        String sku,
        String name,
        String description,
        BigDecimal price,
        Long brandId,
        Set<Long> categoryIds,
        List<ProductImageRequest> images
) {}
