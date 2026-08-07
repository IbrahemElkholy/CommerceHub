package com.commercehub.cart.controller;

import com.commercehub.cart.dto.AddCartItemRequest;
import com.commercehub.cart.dto.ApplyCouponRequest;
import com.commercehub.cart.dto.CartResponse;
import com.commercehub.cart.dto.UpdateCartItemRequest;
import com.commercehub.cart.service.CartService;
import com.commercehub.common.response.ApiResponse;
import com.commercehub.identity.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@PreAuthorize("hasRole('CUSTOMER')")
@Tag(name = "Cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @Operation(summary = "Get current cart")
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal User principal) {
        return ApiResponse.ok(cartService.getOrCreateCart(principal.getId()));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add item to cart")
    public ApiResponse<CartResponse> addItem(@AuthenticationPrincipal User principal,
                                              @Valid @RequestBody AddCartItemRequest request) {
        return ApiResponse.ok(cartService.addItem(principal.getId(), request));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update cart item quantity")
    public ApiResponse<CartResponse> updateItem(@AuthenticationPrincipal User principal,
                                                 @PathVariable UUID productId,
                                                 @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.ok(cartService.updateItem(principal.getId(), productId, request));
    }

    @DeleteMapping("/items/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove cart item")
    public void removeItem(@AuthenticationPrincipal User principal, @PathVariable UUID productId) {
        cartService.removeItem(principal.getId(), productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Clear cart")
    public void clearCart(@AuthenticationPrincipal User principal) {
        cartService.clearCart(principal.getId());
    }

    @PostMapping("/coupon")
    @Operation(summary = "Apply coupon to cart")
    public ApiResponse<CartResponse> applyCoupon(@AuthenticationPrincipal User principal,
                                                  @Valid @RequestBody ApplyCouponRequest request) {
        return ApiResponse.ok(cartService.applyCoupon(principal.getId(), request.couponCode()));
    }

    @DeleteMapping("/coupon")
    @Operation(summary = "Remove coupon from cart")
    public ApiResponse<CartResponse> removeCoupon(@AuthenticationPrincipal User principal) {
        return ApiResponse.ok(cartService.removeCoupon(principal.getId()));
    }
}
