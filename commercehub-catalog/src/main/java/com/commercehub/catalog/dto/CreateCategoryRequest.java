package com.commercehub.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCategoryRequest(
        @NotBlank String name,
        @NotBlank String slug,
        String description,
        Long parentId
) {}
