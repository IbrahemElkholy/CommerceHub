package com.commercehub.identity.dto;

public record UpdateUserRequest(
        String firstName,
        String lastName,
        String phone
) {}
