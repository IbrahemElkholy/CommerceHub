package com.commercehub.wishlist.service;

import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.service.ProductService;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.wishlist.dto.WishlistItemResponse;
import com.commercehub.wishlist.entity.WishlistItem;
import com.commercehub.wishlist.repository.WishlistItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductService productService;

    public WishlistServiceImpl(WishlistItemRepository wishlistItemRepository,
                               ProductService productService) {
        this.wishlistItemRepository = wishlistItemRepository;
        this.productService = productService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WishlistItemResponse> getWishlist(UUID userId, Pageable pageable) {
        return wishlistItemRepository.findAllByUserId(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public WishlistItemResponse addToWishlist(UUID userId, UUID productId) {
        productService.getProductSummaryById(productId);

        WishlistItem item = wishlistItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> {
                    WishlistItem newItem = new WishlistItem();
                    newItem.setUserId(userId);
                    newItem.setProductId(productId);
                    return wishlistItemRepository.save(newItem);
                });
        return toResponse(item);
    }

    @Override
    @Transactional
    public void removeFromWishlist(UUID userId, UUID productId) {
        if (!wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("Wishlist item not found");
        }
        wishlistItemRepository.deleteByUserIdAndProductId(userId, productId);
    }

    private WishlistItemResponse toResponse(WishlistItem item) {
        ProductSummaryResponse product = productService.getProductSummaryById(item.getProductId());
        return new WishlistItemResponse(item.getId(), item.getProductId(), product, item.getCreatedAt());
    }
}
