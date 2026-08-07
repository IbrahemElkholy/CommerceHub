package com.commercehub.order.service;

import com.commercehub.order.dto.OrderResponse;
import com.commercehub.order.dto.OrderSummaryResponse;
import com.commercehub.order.dto.PlaceOrderRequest;
import com.commercehub.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OrderService {

    OrderResponse placeOrder(UUID userId, PlaceOrderRequest request);

    OrderResponse getOrderById(UUID orderId, UUID requestingUserId, boolean isAdmin);

    Page<OrderSummaryResponse> getOrdersForUser(UUID userId, Pageable pageable);

    Page<OrderSummaryResponse> getAllOrders(OrderStatus statusFilter, Pageable pageable);

    OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, UUID changedBy, String note);

    void cancelOrder(UUID orderId, UUID requestingUserId);
}
