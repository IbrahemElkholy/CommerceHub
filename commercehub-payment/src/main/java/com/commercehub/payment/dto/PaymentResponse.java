package com.commercehub.payment.dto;

import com.commercehub.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID orderId,
        BigDecimal amount,
        String currency,
        String method,
        PaymentStatus status,
        String providerRef,
        Instant createdAt
) {}
