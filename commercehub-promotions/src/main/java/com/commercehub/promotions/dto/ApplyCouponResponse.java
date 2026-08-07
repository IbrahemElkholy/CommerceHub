package com.commercehub.promotions.dto;

import com.commercehub.promotions.entity.DiscountType;

import java.math.BigDecimal;

public record ApplyCouponResponse(
        String code,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal discountedAmount
) {}
