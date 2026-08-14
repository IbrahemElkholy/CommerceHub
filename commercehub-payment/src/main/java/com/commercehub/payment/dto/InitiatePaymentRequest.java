package com.commercehub.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record InitiatePaymentRequest(
        @NotNull UUID orderId,
        @NotNull @Positive BigDecimal amount,
        @NotBlank String currency,
        @NotBlank String method,
        @NotBlank String idempotencyKey
) {}
