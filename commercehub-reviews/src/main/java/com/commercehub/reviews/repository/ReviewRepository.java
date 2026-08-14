package com.commercehub.reviews.repository;

import com.commercehub.reviews.entity.Review;
import com.commercehub.reviews.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findAllByProductIdAndStatusAndDeletedAtIsNull(UUID productId, ReviewStatus status, Pageable pageable);

    Page<Review> findAllByUserIdAndDeletedAtIsNull(UUID userId, Pageable pageable);

    Optional<Review> findByProductIdAndUserIdAndDeletedAtIsNull(UUID productId, UUID userId);

    boolean existsByProductIdAndUserIdAndDeletedAtIsNull(UUID productId, UUID userId);

    @Query("SELECT AVG(CAST(r.rating AS double)) FROM Review r WHERE r.productId = :productId AND r.status = 'APPROVED' AND r.deletedAt IS NULL")
    Double findAverageRatingForProduct(UUID productId);
}
