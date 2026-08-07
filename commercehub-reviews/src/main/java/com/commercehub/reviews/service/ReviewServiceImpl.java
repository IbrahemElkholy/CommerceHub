package com.commercehub.reviews.service;

import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.reviews.dto.CreateReviewRequest;
import com.commercehub.reviews.dto.ReviewResponse;
import com.commercehub.reviews.entity.Review;
import com.commercehub.reviews.entity.ReviewStatus;
import com.commercehub.reviews.repository.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional
    public ReviewResponse createReview(UUID userId, CreateReviewRequest request) {
        if (reviewRepository.existsByProductIdAndUserIdAndDeletedAtIsNull(request.productId(), userId)) {
            throw new ConflictException("Review already exists for this product");
        }
        Review review = new Review();
        review.setProductId(request.productId());
        review.setUserId(userId);
        review.setOrderId(request.orderId());
        review.setRating(request.rating());
        review.setTitle(request.title());
        review.setBody(request.body());
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForProduct(UUID productId, Pageable pageable) {
        return reviewRepository.findAllByProductIdAndStatusAndDeletedAtIsNull(productId, ReviewStatus.APPROVED, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMyReviews(UUID userId, Pageable pageable) {
        return reviewRepository.findAllByUserIdAndDeletedAtIsNull(userId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public ReviewResponse moderateReview(UUID reviewId, ReviewStatus status) {
        Review review = findOrThrow(reviewId);
        review.setStatus(status);
        review.setUpdatedAt(Instant.now());
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId, UUID requestingUserId) {
        Review review = findOrThrow(reviewId);
        if (!review.getUserId().equals(requestingUserId)) {
            throw new ResourceNotFoundException("Review not found");
        }
        review.setDeletedAt(Instant.now());
        reviewRepository.save(review);
    }

    private Review findOrThrow(UUID id) {
        return reviewRepository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + id));
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(r.getId(), r.getProductId(), r.getUserId(),
                r.getRating(), r.getTitle(), r.getBody(), r.getStatus(), r.getCreatedAt());
    }
}
