package com.commercehub.promotions.dto;

import com.commercehub.promotions.entity.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateCouponRequest(
        @NotBlank String code,
        String description,
        @NotNull DiscountType discountType,
        @NotNull @Positive BigDecimal discountValue,
        BigDecimal minOrderAmount,
        Integer maxUses,
        @NotNull Instant validFrom,
        Instant validUntil
) {}
