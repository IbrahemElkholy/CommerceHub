package com.commercehub.order.service;

import com.commercehub.cart.entity.Cart;
import com.commercehub.cart.entity.CartStatus;
import com.commercehub.cart.repository.CartRepository;
import com.commercehub.common.exception.InvalidOrderStateException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.inventory.dto.StockReservationRequest;
import com.commercehub.inventory.service.InventoryService;
import com.commercehub.order.dto.OrderItemResponse;
import com.commercehub.order.dto.OrderResponse;
import com.commercehub.order.dto.OrderStatusHistoryResponse;
import com.commercehub.order.dto.OrderSummaryResponse;
import com.commercehub.order.dto.PlaceOrderRequest;
import com.commercehub.order.dto.ShippingAddressDto;
import com.commercehub.order.entity.Order;
import com.commercehub.order.entity.OrderItem;
import com.commercehub.order.entity.OrderStatus;
import com.commercehub.order.entity.ShippingAddress;
import com.commercehub.order.event.OrderPlacedEvent;
import com.commercehub.order.event.OrderStatusChangedEvent;
import com.commercehub.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final InventoryService inventoryService;
    private final ApplicationEventPublisher eventPublisher;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            InventoryService inventoryService,
                            ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.inventoryService = inventoryService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(UUID userId, PlaceOrderRequest request) {
        orderRepository.findByIdempotencyKey(request.idempotencyKey())
                .ifPresent(existing -> {
                    throw new InvalidOrderStateException(
                            "Order already placed with key: " + request.idempotencyKey());
                });

        Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new InvalidOrderStateException("Cannot place order with empty cart");
        }

        List<StockReservationRequest> reservations = cart.getItems().stream()
                .map(i -> new StockReservationRequest(i.getProductId(), i.getQuantity()))
                .toList();
        inventoryService.reserveStock(cart.getId(), reservations);

        Order order = new Order();
        order.setUserId(userId);
        order.setIdempotencyKey(request.idempotencyKey());
        order.setNotes(request.notes());
        order.setShippingAddress(mapAddress(request.shippingAddress()));

        for (var cartItem : cart.getItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProductId(cartItem.getProductId());
            oi.setProductName("");
            oi.setProductSku("");
            oi.setQuantity(cartItem.getQuantity());
            oi.setUnitPrice(cartItem.getUnitPrice());
            oi.setLineTotal(cartItem.getLineTotal());
            order.getItems().add(oi);
        }

        order.setSubtotal(cart.getSubtotal());
        order.setDiscountAmount(cart.getDiscountAmount());
        order.setTotal(cart.getSubtotal().subtract(cart.getDiscountAmount()).max(java.math.BigDecimal.ZERO));

        order.addStatusHistory(OrderStatus.PENDING, userId, "Order placed");

        cart.setStatus(CartStatus.CHECKED_OUT);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderPlacedEvent(saved.getId(), userId));
        log.info("Order placed: id={}, user={}", saved.getId(), userId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, UUID requestingUserId, boolean isAdmin) {
        Order order = findOrThrow(orderId);
        if (!isAdmin && !order.getUserId().equals(requestingUserId)) {
            throw new ResourceNotFoundException("Order not found");
        }
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getOrdersForUser(UUID userId, Pageable pageable) {
        return orderRepository.findAllByUserIdAndDeletedAtIsNull(userId, pageable)
                .map(this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getAllOrders(OrderStatus statusFilter, Pageable pageable) {
        if (statusFilter != null) {
            return orderRepository.findAllByStatusAndDeletedAtIsNull(statusFilter, pageable).map(this::toSummary);
        }
        return orderRepository.findAllByDeletedAtIsNull(pageable).map(this::toSummary);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus, UUID changedBy, String note) {
        Order order = findOrThrow(orderId);
        OrderStatus old = order.getStatus();
        order.addStatusHistory(newStatus, changedBy, note);
        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderStatusChangedEvent(orderId, order.getUserId(), old, newStatus));
        log.info("Order status updated: id={}, {} -> {}", orderId, old, newStatus);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancelOrder(UUID orderId, UUID requestingUserId) {
        Order order = findOrThrow(orderId);
        if (!order.getUserId().equals(requestingUserId)) {
            throw new ResourceNotFoundException("Order not found");
        }
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOrderStateException("Order cannot be cancelled in status: " + order.getStatus());
        }
        inventoryService.releaseReservation(orderId);
        order.addStatusHistory(OrderStatus.CANCELLED, requestingUserId, "Cancelled by customer");
        orderRepository.save(order);
        log.info("Order cancelled: id={}", orderId);
    }

    private Order findOrThrow(UUID orderId) {
        return orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private ShippingAddress mapAddress(ShippingAddressDto dto) {
        ShippingAddress addr = new ShippingAddress();
        addr.setStreetLine1(dto.streetLine1());
        addr.setStreetLine2(dto.streetLine2());
        addr.setCity(dto.city());
        addr.setState(dto.state());
        addr.setPostalCode(dto.postalCode());
        addr.setCountryCode(dto.countryCode());
        return addr;
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(i ->
                new OrderItemResponse(i.getId(), i.getProductId(), i.getProductName(), i.getProductSku(),
                        i.getQuantity(), i.getUnitPrice(), i.getLineTotal())).toList();
        List<OrderStatusHistoryResponse> history = order.getStatusHistory().stream().map(h ->
                new OrderStatusHistoryResponse(h.getStatus(), h.getNote(), h.getChangedBy(), h.getCreatedAt())).toList();
        ShippingAddressDto addr = null;
        if (order.getShippingAddress() != null) {
            var sa = order.getShippingAddress();
            addr = new ShippingAddressDto(sa.getStreetLine1(), sa.getStreetLine2(),
                    sa.getCity(), sa.getState(), sa.getPostalCode(), sa.getCountryCode());
        }
        return new OrderResponse(order.getId(), order.getStatus(), items, order.getSubtotal(),
                order.getDiscountAmount(), order.getShippingAmount(), order.getTotal(),
                order.getCurrency(), addr, order.getNotes(),
                order.getCreatedAt(), order.getUpdatedAt(), history);
    }

    private OrderSummaryResponse toSummary(Order order) {
        return new OrderSummaryResponse(order.getId(), order.getStatus(), order.getTotal(),
                order.getCurrency(), order.getItems().size(), order.getCreatedAt());
    }
}
