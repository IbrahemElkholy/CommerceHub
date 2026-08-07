package com.commercehub.identity.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.identity.dto.AuthResponse;
import com.commercehub.identity.dto.LoginRequest;
import com.commercehub.identity.dto.PasswordResetDto;
import com.commercehub.identity.dto.PasswordResetRequestDto;
import com.commercehub.identity.dto.RefreshTokenRequest;
import com.commercehub.identity.dto.RegisterRequest;
import com.commercehub.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new customer account")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive tokens")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ApiResponse.ok();
    }

    @PostMapping("/password-reset/request")
    @Operation(summary = "Request a password reset email")
    public ApiResponse<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDto request) {
        authService.requestPasswordReset(request);
        return ApiResponse.ok();
    }

    @PostMapping("/password-reset/confirm")
    @Operation(summary = "Reset password using token")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody PasswordResetDto request) {
        authService.resetPassword(request);
        return ApiResponse.ok();
    }
}
