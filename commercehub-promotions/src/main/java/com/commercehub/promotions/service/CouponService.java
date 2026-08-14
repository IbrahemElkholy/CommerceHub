package com.commercehub.promotions.service;

import com.commercehub.promotions.dto.ApplyCouponResponse;
import com.commercehub.promotions.dto.CouponResponse;
import com.commercehub.promotions.dto.CreateCouponRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface CouponService {

    Page<CouponResponse> listCoupons(boolean activeOnly, Pageable pageable);

    CouponResponse createCoupon(CreateCouponRequest request);

    CouponResponse deactivateCoupon(UUID couponId);

    ApplyCouponResponse validateAndCalculate(String code, BigDecimal orderSubtotal);
}
