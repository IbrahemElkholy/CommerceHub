package com.commercehub.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWarehouseRequest(
        @NotBlank String name,
        @NotBlank String code,
        String address
) {}
