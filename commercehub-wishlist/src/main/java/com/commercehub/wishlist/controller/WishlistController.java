package com.commercehub.wishlist.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.entity.User;
import com.commercehub.wishlist.dto.WishlistItemResponse;
import com.commercehub.wishlist.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@PreAuthorize("hasRole('CUSTOMER')")
@Tag(name = "Wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    @Operation(summary = "Get wishlist")
    public ApiResponse<PagedResponse<WishlistItemResponse>> getWishlist(@AuthenticationPrincipal User principal,
                                                                         @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(wishlistService.getWishlist(principal.getId(), pageable)));
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add product to wishlist")
    public ApiResponse<WishlistItemResponse> add(@AuthenticationPrincipal User principal,
                                                  @PathVariable UUID productId) {
        return ApiResponse.ok(wishlistService.addToWishlist(principal.getId(), productId));
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove product from wishlist")
    public void remove(@AuthenticationPrincipal User principal, @PathVariable UUID productId) {
        wishlistService.removeFromWishlist(principal.getId(), productId);
    }
}
