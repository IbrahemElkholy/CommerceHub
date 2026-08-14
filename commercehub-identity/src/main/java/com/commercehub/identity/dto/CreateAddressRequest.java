package com.commercehub.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(
        String label,
        @NotBlank String streetLine1,
        String streetLine2,
        @NotBlank String city,
        String state,
        @NotBlank String postalCode,
        @NotBlank @Size(min = 2, max = 2) String countryCode,
        boolean isDefault
) {}
