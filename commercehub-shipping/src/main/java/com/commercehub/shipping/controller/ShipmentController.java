package com.commercehub.shipping.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.shipping.dto.CreateShipmentRequest;
import com.commercehub.shipping.dto.ShipmentResponse;
import com.commercehub.shipping.dto.UpdateShipmentRequest;
import com.commercehub.shipping.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shipments")
@Tag(name = "Shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create shipment")
    public ApiResponse<ShipmentResponse> create(@Valid @RequestBody CreateShipmentRequest request) {
        return ApiResponse.ok(shipmentService.createShipment(request));
    }

    @GetMapping("/orders/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @Operation(summary = "Get shipments for an order")
    public ApiResponse<List<ShipmentResponse>> getForOrder(@PathVariable UUID orderId) {
        return ApiResponse.ok(shipmentService.getShipmentsForOrder(orderId));
    }

    @GetMapping("/{shipmentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @Operation(summary = "Get shipment by ID")
    public ApiResponse<ShipmentResponse> get(@PathVariable UUID shipmentId) {
        return ApiResponse.ok(shipmentService.getShipment(shipmentId));
    }

    @PatchMapping("/{shipmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update shipment status/tracking")
    public ApiResponse<ShipmentResponse> update(@PathVariable UUID shipmentId,
                                                 @RequestBody UpdateShipmentRequest request) {
        return ApiResponse.ok(shipmentService.updateShipment(shipmentId, request));
    }
}
