package com.commercehub.common.security;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

public interface JwtService {

    String generateAccessToken(UserDetails userDetails);

    String generateRefreshToken();

    boolean validateToken(String token);

    UUID extractUserId(String token);

    List<String> extractRoles(String token);
}
