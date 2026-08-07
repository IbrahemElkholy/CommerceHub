package com.commercehub.identity.event;

import java.util.UUID;

public record PasswordResetRequestedEvent(UUID userId, String email, String rawToken) {}
