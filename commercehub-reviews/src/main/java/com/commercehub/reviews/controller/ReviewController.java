package com.commercehub.reviews.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.entity.User;
import com.commercehub.reviews.dto.CreateReviewRequest;
import com.commercehub.reviews.dto.ReviewResponse;
import com.commercehub.reviews.entity.ReviewStatus;
import com.commercehub.reviews.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@Tag(name = "Reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a product review")
    public ApiResponse<ReviewResponse> create(@AuthenticationPrincipal User principal,
                                               @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.ok(reviewService.createReview(principal.getId(), request));
    }

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get approved reviews for a product")
    public ApiResponse<PagedResponse<ReviewResponse>> getForProduct(@PathVariable UUID productId,
                                                                     @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(reviewService.getReviewsForProduct(productId, pageable)));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current user's reviews")
    public ApiResponse<PagedResponse<ReviewResponse>> getMyReviews(@AuthenticationPrincipal User principal,
                                                                    @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(reviewService.getMyReviews(principal.getId(), pageable)));
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete own review")
    public void delete(@AuthenticationPrincipal User principal, @PathVariable UUID reviewId) {
        reviewService.deleteReview(reviewId, principal.getId());
    }

    @PatchMapping("/{reviewId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Moderate a review (admin)")
    public ApiResponse<ReviewResponse> moderate(@PathVariable UUID reviewId,
                                                 @RequestParam ReviewStatus status) {
        return ApiResponse.ok(reviewService.moderateReview(reviewId, status));
    }
}
