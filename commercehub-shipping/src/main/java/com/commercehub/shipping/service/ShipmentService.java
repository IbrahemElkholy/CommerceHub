package com.commercehub.shipping.service;

import com.commercehub.shipping.dto.CreateShipmentRequest;
import com.commercehub.shipping.dto.ShipmentResponse;
import com.commercehub.shipping.dto.UpdateShipmentRequest;

import java.util.List;
import java.util.UUID;

public interface ShipmentService {

    ShipmentResponse createShipment(CreateShipmentRequest request);

    List<ShipmentResponse> getShipmentsForOrder(UUID orderId);

    ShipmentResponse getShipment(UUID shipmentId);

    ShipmentResponse updateShipment(UUID shipmentId, UpdateShipmentRequest request);
}
