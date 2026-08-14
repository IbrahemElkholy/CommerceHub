package com.commercehub.catalog.dto;

public record UpdateBrandRequest(
        String name,
        String slug,
        String logoUrl
) {}
