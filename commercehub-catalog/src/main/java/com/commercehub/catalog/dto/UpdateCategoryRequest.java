package com.commercehub.catalog.dto;

public record UpdateCategoryRequest(
        String name,
        String slug,
        String description,
        Long parentId
) {}
