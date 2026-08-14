package com.commercehub.cart.service;

import com.commercehub.cart.dto.AddCartItemRequest;
import com.commercehub.cart.dto.CartItemResponse;
import com.commercehub.cart.dto.CartResponse;
import com.commercehub.cart.dto.UpdateCartItemRequest;
import com.commercehub.cart.entity.Cart;
import com.commercehub.cart.entity.CartItem;
import com.commercehub.cart.entity.CartStatus;
import com.commercehub.cart.repository.CartItemRepository;
import com.commercehub.cart.repository.CartRepository;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.service.ProductService;
import com.commercehub.common.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CartServiceImpl implements CartService {

    private static final Logger log = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductPriceLookup productPriceLookup;
    private final ProductService productService;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductPriceLookup productPriceLookup,
                           ProductService productService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productPriceLookup = productPriceLookup;
        this.productService = productService;
    }

    @Override
    @Transactional
    public CartResponse getOrCreateCart(UUID userId) {
        Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> createCart(userId));
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addItem(UUID userId, AddCartItemRequest request) {
        Cart cart = getActiveCart(userId);
        BigDecimal price = productPriceLookup.getPrice(request.productId());

        CartItem item = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), request.productId())
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setCart(cart);
                    newItem.setProductId(request.productId());
                    newItem.setUnitPrice(price);
                    return newItem;
                });

        item.setQuantity(item.getQuantity() + request.quantity());
        item.setUnitPrice(price);
        cartItemRepository.save(item);

        if (!cart.getItems().contains(item)) {
            cart.getItems().add(item);
        }

        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItem(UUID userId, UUID productId, UpdateCartItemRequest request) {
        Cart cart = getActiveCart(userId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        item.setQuantity(request.quantity());
        cartItemRepository.save(item);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(UUID userId, UUID productId) {
        Cart cart = getActiveCart(userId);
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse clearCart(UUID userId) {
        Cart cart = getActiveCart(userId);
        cart.getItems().clear();
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse applyCoupon(UUID userId, String couponCode) {
        Cart cart = getActiveCart(userId);
        cart.setCouponCode(couponCode);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeCoupon(UUID userId) {
        Cart cart = getActiveCart(userId);
        cart.setCouponCode(null);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);
        return toResponse(cart);
    }

    private Cart getActiveCart(UUID userId) {
        return cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));
    }

    private Cart createCart(UUID userId) {
        Cart cart = new Cart();
        cart.setUserId(userId);
        cart.setStatus(CartStatus.ACTIVE);
        return cartRepository.save(cart);
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(i -> {
                    ProductSummaryResponse product = productService.getProductSummaryById(i.getProductId());
                    return new CartItemResponse(
                            i.getId(), i.getProductId(), product.name(), product.primaryImageUrl(),
                            i.getQuantity(), i.getUnitPrice(), i.getLineTotal());
                })
                .toList();
        BigDecimal subtotal = cart.getSubtotal();
        BigDecimal totalAfterDiscount = subtotal.subtract(cart.getDiscountAmount()).max(BigDecimal.ZERO);
        return new CartResponse(cart.getId(), items, subtotal, cart.getCouponCode(), cart.getDiscountAmount(), totalAfterDiscount);
    }
}
