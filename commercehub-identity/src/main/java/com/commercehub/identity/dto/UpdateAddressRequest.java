package com.commercehub.identity.dto;

public record UpdateAddressRequest(
        String label,
        String streetLine1,
        String streetLine2,
        String city,
        String state,
        String postalCode,
        String countryCode,
        Boolean isDefault
) {}
