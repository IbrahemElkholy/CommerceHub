package com.commercehub.order.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.entity.User;
import com.commercehub.order.dto.OrderResponse;
import com.commercehub.order.dto.OrderSummaryResponse;
import com.commercehub.order.dto.PlaceOrderRequest;
import com.commercehub.order.dto.UpdateOrderStatusRequest;
import com.commercehub.order.entity.OrderStatus;
import com.commercehub.order.service.OrderService;
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
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Place a new order")
    public ApiResponse<OrderResponse> placeOrder(@AuthenticationPrincipal User principal,
                                                  @Valid @RequestBody PlaceOrderRequest request) {
        return ApiResponse.ok(orderService.placeOrder(principal.getId(), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get current user's orders")
    public ApiResponse<PagedResponse<OrderSummaryResponse>> getMyOrders(@AuthenticationPrincipal User principal,
                                                                         @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(orderService.getOrdersForUser(principal.getId(), pageable)));
    }

    @GetMapping("/me/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get own order by ID")
    public ApiResponse<OrderResponse> getMyOrder(@AuthenticationPrincipal User principal,
                                                  @PathVariable UUID orderId) {
        return ApiResponse.ok(orderService.getOrderById(orderId, principal.getId(), false));
    }

    @DeleteMapping("/me/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cancel own order")
    public void cancelOrder(@AuthenticationPrincipal User principal, @PathVariable UUID orderId) {
        orderService.cancelOrder(orderId, principal.getId());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all orders (admin)")
    public ApiResponse<PagedResponse<OrderSummaryResponse>> listAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(orderService.getAllOrders(status, pageable)));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get order by ID (admin)")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable UUID orderId,
                                                    @AuthenticationPrincipal User principal) {
        return ApiResponse.ok(orderService.getOrderById(orderId, principal.getId(), true));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update order status (admin)")
    public ApiResponse<OrderResponse> updateStatus(@PathVariable UUID orderId,
                                                    @AuthenticationPrincipal User principal,
                                                    @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ApiResponse.ok(orderService.updateOrderStatus(orderId, request.status(), principal.getId(), request.note()));
    }
}
