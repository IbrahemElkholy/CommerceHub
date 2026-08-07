package com.commercehub.order.repository;

import com.commercehub.order.entity.Order;
import com.commercehub.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findAllByUserIdAndDeletedAtIsNull(UUID userId, Pageable pageable);

    Page<Order> findAllByStatusAndDeletedAtIsNull(OrderStatus status, Pageable pageable);

    Page<Order> findAllByDeletedAtIsNull(Pageable pageable);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    Optional<Order> findByIdAndDeletedAtIsNull(UUID id);
}
