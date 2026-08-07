package com.commercehub.identity.service;

import com.commercehub.identity.dto.AuthResponse;
import com.commercehub.identity.dto.LoginRequest;
import com.commercehub.identity.dto.PasswordResetDto;
import com.commercehub.identity.dto.PasswordResetRequestDto;
import com.commercehub.identity.dto.RefreshTokenRequest;
import com.commercehub.identity.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    void requestPasswordReset(PasswordResetRequestDto request);

    void resetPassword(PasswordResetDto request);
}
