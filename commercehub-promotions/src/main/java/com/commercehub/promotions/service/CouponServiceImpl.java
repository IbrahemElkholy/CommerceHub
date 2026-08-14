package com.commercehub.promotions.service;

import com.commercehub.common.exception.BusinessException;
import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.promotions.dto.ApplyCouponResponse;
import com.commercehub.promotions.dto.CouponResponse;
import com.commercehub.promotions.dto.CreateCouponRequest;
import com.commercehub.promotions.entity.Coupon;
import com.commercehub.promotions.entity.DiscountType;
import com.commercehub.promotions.repository.CouponRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    public CouponServiceImpl(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> listCoupons(boolean activeOnly, Pageable pageable) {
        if (activeOnly) {
            return couponRepository.findAllByActive(true, pageable).map(this::toResponse);
        }
        return couponRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request) {
        if (couponRepository.findByCode(request.code()).isPresent()) {
            throw new ConflictException("Coupon code already exists: " + request.code());
        }
        Coupon coupon = new Coupon();
        coupon.setCode(request.code().toUpperCase());
        coupon.setDescription(request.description());
        coupon.setDiscountType(request.discountType());
        coupon.setDiscountValue(request.discountValue());
        coupon.setMinOrderAmount(request.minOrderAmount());
        coupon.setMaxUses(request.maxUses());
        coupon.setValidFrom(request.validFrom());
        coupon.setValidUntil(request.validUntil());
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse deactivateCoupon(UUID couponId) {
        Coupon coupon = findOrThrow(couponId);
        coupon.setActive(false);
        return toResponse(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public ApplyCouponResponse validateAndCalculate(String code, BigDecimal orderSubtotal) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found: " + code));
        if (!coupon.isCurrentlyValid()) {
            throw new BusinessException("COUPON_INVALID", "Coupon is not valid or expired: " + code) {};
        }
        if (coupon.getMinOrderAmount() != null && orderSubtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BusinessException(
                    "COUPON_MIN_ORDER_NOT_MET", "Order subtotal does not meet minimum amount for coupon") {};
        }
        BigDecimal discounted;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discounted = orderSubtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discounted = coupon.getDiscountValue().min(orderSubtotal);
        }
        return new ApplyCouponResponse(coupon.getCode(), coupon.getDiscountType(), coupon.getDiscountValue(), discounted);
    }

    private Coupon findOrThrow(UUID id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found: " + id));
    }

    private CouponResponse toResponse(Coupon c) {
        return new CouponResponse(c.getId(), c.getCode(), c.getDescription(), c.getDiscountType(),
                c.getDiscountValue(), c.getMinOrderAmount(), c.getMaxUses(), c.getCurrentUses(),
                c.getValidFrom(), c.getValidUntil(), c.isActive());
    }
}
