package com.commercehub.catalog.dto;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long parentId,
        List<CategoryResponse> children
) {}
