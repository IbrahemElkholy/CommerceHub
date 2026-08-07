package com.commercehub.wishlist.dto;

import com.commercehub.catalog.dto.ProductSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record WishlistItemResponse(UUID id, UUID productId, ProductSummaryResponse product, Instant addedAt) {}
