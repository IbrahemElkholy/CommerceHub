package com.commercehub.identity.dto;

import com.commercehub.identity.entity.UserStatus;

import java.util.UUID;

public record UserSummaryResponse(
        UUID id,
        String email,
        String fullName,
        UserStatus status
) {}
