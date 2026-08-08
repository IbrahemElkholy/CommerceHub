package com.commercehub.order.service;

import com.commercehub.cart.entity.Cart;
import com.commercehub.cart.entity.CartStatus;
import com.commercehub.cart.repository.CartRepository;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.service.ProductService;
import com.commercehub.common.exception.InvalidOrderStateException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.identity.dto.AddressResponse;
import com.commercehub.identity.service.UserService;
import com.commercehub.inventory.dto.StockReservationRequest;
import com.commercehub.inventory.service.InventoryService;
import com.commercehub.order.dto.OrderItemResponse;
import com.commercehub.order.dto.OrderResponse;
import com.commercehub.order.dto.OrderStatusHistoryResponse;
import com.commercehub.order.dto.OrderSummaryResponse;
import com.commercehub.order.dto.PlaceOrderRequest;
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
    private final UserService userService;
    private final ProductService productService;
    private final ApplicationEventPublisher eventPublisher;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            InventoryService inventoryService,
                            UserService userService,
                            ProductService productService,
                            ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.inventoryService = inventoryService;
        this.userService = userService;
        this.productService = productService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(UUID userId, PlaceOrderRequest request, String idempotencyKey) {
        orderRepository.findByIdempotencyKey(idempotencyKey)
                .ifPresent(existing -> {
                    throw new InvalidOrderStateException(
                            "Order already placed with key: " + idempotencyKey);
                });

        Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new InvalidOrderStateException("Cannot place order with empty cart");
        }

        AddressResponse address = userService.getAddresses(userId).stream()
                .filter(a -> a.id().equals(request.shippingAddressId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found"));

        List<StockReservationRequest> reservations = cart.getItems().stream()
                .map(i -> new StockReservationRequest(i.getProductId(), i.getQuantity()))
                .toList();
        inventoryService.reserveStock(cart.getId(), reservations);

        Order order = new Order();
        order.setUserId(userId);
        order.setIdempotencyKey(idempotencyKey);
        order.setNotes(request.notes());
        order.setShippingAddress(mapAddress(address));

        for (var cartItem : cart.getItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProductId(cartItem.getProductId());
            try {
                ProductSummaryResponse product = productService.getProductSummaryById(cartItem.getProductId());
                oi.setProductName(product.name());
                oi.setProductSku(product.sku());
            } catch (ResourceNotFoundException e) {
                oi.setProductName("");
                oi.setProductSku("");
            }
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
    public void cancelOrder(UUID orderId, UUID requestingUserId, String reason) {
        Order order = findOrThrow(orderId);
        if (!order.getUserId().equals(requestingUserId)) {
            throw new ResourceNotFoundException("Order not found");
        }
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOrderStateException("Order cannot be cancelled in status: " + order.getStatus());
        }
        inventoryService.releaseReservation(orderId);
        String note = (reason != null && !reason.isBlank()) ? reason : "Cancelled by customer";
        order.addStatusHistory(OrderStatus.CANCELLED, requestingUserId, note);
        orderRepository.save(order);
        log.info("Order cancelled: id={}", orderId);
    }

    private Order findOrThrow(UUID orderId) {
        return orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private ShippingAddress mapAddress(AddressResponse dto) {
        ShippingAddress addr = new ShippingAddress();
        addr.setStreetLine1(dto.streetLine1());
        addr.setStreetLine2(dto.streetLine2());
        addr.setCity(dto.city());
        addr.setState(dto.state());
        addr.setPostalCode(dto.postalCode());
        addr.setCountryCode(dto.countryCode());
        return addr;
    }

    private String orderNumberFrom(UUID id) {
        return "ORD-" + id.toString().substring(0, 8).toUpperCase();
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(i ->
                new OrderItemResponse(i.getId(), i.getProductId(), i.getProductName(), i.getProductSku(),
                        i.getQuantity(), i.getUnitPrice(), i.getLineTotal())).toList();
        List<OrderStatusHistoryResponse> history = order.getStatusHistory().stream().map(h ->
                new OrderStatusHistoryResponse(null, h.getStatus(), h.getNote(), h.getChangedBy(), h.getCreatedAt())).toList();
        ShippingAddress sa = order.getShippingAddress();
        return new OrderResponse(
                order.getId(),
                orderNumberFrom(order.getId()),
                order.getUserId(),
                order.getStatus(),
                items,
                sa != null ? sa.getStreetLine1() : null,
                sa != null ? sa.getCity() : null,
                sa != null ? sa.getState() : null,
                sa != null ? sa.getPostalCode() : null,
                sa != null ? sa.getCountryCode() : null,
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getShippingAmount(),
                java.math.BigDecimal.ZERO,
                order.getTotal(),
                null,
                history,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    private OrderSummaryResponse toSummary(Order order) {
        return new OrderSummaryResponse(order.getId(), orderNumberFrom(order.getId()), order.getStatus(),
                order.getTotal(), order.getItems().size(), order.getCreatedAt());
    }
}
