package com.commercehub.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBrandRequest(
        @NotBlank String name,
        @NotBlank String slug,
        String logoUrl
) {}
