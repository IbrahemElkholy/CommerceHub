package com.commercehub.identity.service;

import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.InvalidTokenException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.common.security.JwtProperties;
import com.commercehub.common.security.JwtService;
import com.commercehub.identity.dto.AuthResponse;
import com.commercehub.identity.dto.LoginRequest;
import com.commercehub.identity.dto.PasswordResetDto;
import com.commercehub.identity.dto.PasswordResetRequestDto;
import com.commercehub.identity.dto.RefreshTokenRequest;
import com.commercehub.identity.dto.RegisterRequest;
import com.commercehub.identity.entity.PasswordResetToken;
import com.commercehub.identity.entity.RefreshToken;
import com.commercehub.identity.entity.Role;
import com.commercehub.identity.entity.RoleName;
import com.commercehub.identity.entity.User;
import com.commercehub.identity.event.PasswordResetRequestedEvent;
import com.commercehub.identity.event.UserRegisteredEvent;
import com.commercehub.identity.repository.PasswordResetTokenRepository;
import com.commercehub.identity.repository.RefreshTokenRepository;
import com.commercehub.identity.repository.RoleRepository;
import com.commercehub.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final SecureRandom secureRandom;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           JwtService jwtService,
                           JwtProperties jwtProperties,
                           PasswordEncoder passwordEncoder,
                           ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
        this.secureRandom = new SecureRandom();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email(), "EMAIL_ALREADY_EXISTS");
        }

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Role CUSTOMER not found", "ROLE_NOT_FOUND"));

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRoles(Set.of(customerRole));
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();
        saveRefreshToken(user, rawRefreshToken);

        log.info("User registered: userId={}", user.getId());
        eventPublisher.publishEvent(new UserRegisteredEvent(user.getId(), user.getEmail(), user.getFirstName()));

        return AuthResponse.of(accessToken, rawRefreshToken, jwtProperties.accessTokenExpiry());
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isAccountNonLocked()) {
            throw new DisabledException("User account is suspended");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();
        saveRefreshToken(user, rawRefreshToken);

        log.info("User logged in: userId={}", user.getId());
        return AuthResponse.of(accessToken, rawRefreshToken, jwtProperties.accessTokenExpiry());
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String hash = sha256(request.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token is expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();
        saveRefreshToken(user, rawRefreshToken);

        return AuthResponse.of(accessToken, rawRefreshToken, jwtProperties.accessTokenExpiry());
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequestDto request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            byte[] bytes = new byte[32];
            secureRandom.nextBytes(bytes);
            String rawToken = HexFormat.of().formatHex(bytes);
            String hash = sha256(rawToken);

            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(hash);
            token.setExpiresAt(Instant.now().plusSeconds(3600));
            passwordResetTokenRepository.save(token);

            log.info("Password reset requested for userId={}", user.getId());
            eventPublisher.publishEvent(new PasswordResetRequestedEvent(user.getId(), user.getEmail(), rawToken));
        });
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetDto request) {
        String hash = sha256(request.token());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Reset token is expired or already used");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        refreshTokenRepository.deleteAllByUserId(user.getId());
        log.info("Password reset completed for userId={}", user.getId());
    }

    private void saveRefreshToken(User user, String rawToken) {
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(sha256(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(jwtProperties.refreshTokenExpiry()));
        refreshTokenRepository.save(token);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
