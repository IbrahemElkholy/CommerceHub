package com.commercehub.identity.event;

import java.util.UUID;

public record UserRegisteredEvent(UUID userId, String email, String firstName) {}
