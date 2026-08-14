package com.commercehub.shipping.service;

import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.shipping.dto.CreateShipmentRequest;
import com.commercehub.shipping.dto.ShipmentResponse;
import com.commercehub.shipping.dto.UpdateShipmentRequest;
import com.commercehub.shipping.entity.Shipment;
import com.commercehub.shipping.entity.ShipmentStatus;
import com.commercehub.shipping.repository.ShipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ShipmentServiceImpl implements ShipmentService {

    private static final Logger log = LoggerFactory.getLogger(ShipmentServiceImpl.class);

    private final ShipmentRepository shipmentRepository;

    public ShipmentServiceImpl(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        Shipment shipment = new Shipment();
        shipment.setOrderId(request.orderId());
        shipment.setTrackingNumber(request.trackingNumber());
        shipment.setCarrier(request.carrier());
        shipment.setEstimatedAt(request.estimatedAt());
        Shipment saved = shipmentRepository.save(shipment);
        log.info("Shipment created: id={}, orderId={}", saved.getId(), saved.getOrderId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> getShipmentsForOrder(UUID orderId) {
        return shipmentRepository.findAllByOrderId(orderId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getShipment(UUID shipmentId) {
        return toResponse(findOrThrow(shipmentId));
    }

    @Override
    @Transactional
    public ShipmentResponse updateShipment(UUID shipmentId, UpdateShipmentRequest request) {
        Shipment shipment = findOrThrow(shipmentId);
        if (request.status() != null) {
            shipment.setStatus(request.status());
            if (request.status() == ShipmentStatus.SHIPPED && shipment.getShippedAt() == null) {
                shipment.setShippedAt(Instant.now());
            }
            if (request.status() == ShipmentStatus.DELIVERED && shipment.getDeliveredAt() == null) {
                shipment.setDeliveredAt(Instant.now());
            }
        }
        if (request.trackingNumber() != null) shipment.setTrackingNumber(request.trackingNumber());
        if (request.carrier() != null) shipment.setCarrier(request.carrier());
        if (request.estimatedAt() != null) shipment.setEstimatedAt(request.estimatedAt());
        shipment.setUpdatedAt(Instant.now());
        return toResponse(shipmentRepository.save(shipment));
    }

    private Shipment findOrThrow(UUID id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + id));
    }

    private ShipmentResponse toResponse(Shipment s) {
        return new ShipmentResponse(s.getId(), s.getOrderId(), s.getTrackingNumber(), s.getCarrier(),
                s.getStatus(), s.getShippedAt(), s.getDeliveredAt(), s.getEstimatedAt(), s.getCreatedAt());
    }
}
