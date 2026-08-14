package com.commercehub.shipping.repository;

import com.commercehub.shipping.entity.Shipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

    List<Shipment> findAllByOrderId(UUID orderId);

    Page<Shipment> findAll(Pageable pageable);
}
