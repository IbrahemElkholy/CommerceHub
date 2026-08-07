package com.commercehub.reviews.service;

import com.commercehub.reviews.dto.CreateReviewRequest;
import com.commercehub.reviews.dto.ReviewResponse;
import com.commercehub.reviews.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID userId, CreateReviewRequest request);

    Page<ReviewResponse> getReviewsForProduct(UUID productId, Pageable pageable);

    Page<ReviewResponse> getMyReviews(UUID userId, Pageable pageable);

    ReviewResponse moderateReview(UUID reviewId, ReviewStatus status);

    void deleteReview(UUID reviewId, UUID requestingUserId);
}
