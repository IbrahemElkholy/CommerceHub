package com.commercehub.identity.dto;

import java.util.UUID;

public record AddressResponse(
        UUID id,
        String label,
        String streetLine1,
        String streetLine2,
        String city,
        String state,
        String postalCode,
        String countryCode,
        boolean isDefault
) {}
