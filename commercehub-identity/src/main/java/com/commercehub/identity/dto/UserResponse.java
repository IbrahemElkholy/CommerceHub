package com.commercehub.identity.dto;

import com.commercehub.identity.entity.UserStatus;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        UserStatus status,
        Set<String> roles,
        boolean emailVerified,
        Instant createdAt
) {}
