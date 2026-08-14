package com.commercehub.identity.repository;

import com.commercehub.identity.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String hash);

    void deleteAllByUserId(UUID userId);
}
