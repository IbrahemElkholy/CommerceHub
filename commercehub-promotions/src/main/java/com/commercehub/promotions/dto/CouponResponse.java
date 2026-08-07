package com.commercehub.promotions.dto;

import com.commercehub.promotions.entity.DiscountType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CouponResponse(
        UUID id,
        String code,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minOrderAmount,
        Integer maxUses,
        int currentUses,
        Instant validFrom,
        Instant validUntil,
        boolean active
) {}
