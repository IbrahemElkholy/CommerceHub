package com.commercehub.wishlist.service;

import com.commercehub.wishlist.dto.WishlistItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WishlistService {

    Page<WishlistItemResponse> getWishlist(UUID userId, Pageable pageable);

    WishlistItemResponse addToWishlist(UUID userId, UUID productId);

    void removeFromWishlist(UUID userId, UUID productId);
}
