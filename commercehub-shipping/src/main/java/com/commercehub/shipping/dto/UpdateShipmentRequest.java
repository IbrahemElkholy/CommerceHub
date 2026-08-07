package com.commercehub.shipping.dto;

import com.commercehub.shipping.entity.ShipmentStatus;

import java.time.Instant;

public record UpdateShipmentRequest(ShipmentStatus status, String trackingNumber, String carrier, Instant estimatedAt) {}
