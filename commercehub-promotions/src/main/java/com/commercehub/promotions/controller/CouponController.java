package com.commercehub.promotions.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.promotions.dto.ApplyCouponResponse;
import com.commercehub.promotions.dto.CouponResponse;
import com.commercehub.promotions.dto.CreateCouponRequest;
import com.commercehub.promotions.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/promotions/coupons")
@Tag(name = "Coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List coupons")
    public ApiResponse<PagedResponse<CouponResponse>> list(
            @RequestParam(defaultValue = "false") boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(couponService.listCoupons(activeOnly, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create coupon")
    public ApiResponse<CouponResponse> create(@Valid @RequestBody CreateCouponRequest request) {
        return ApiResponse.ok(couponService.createCoupon(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate coupon")
    public ApiResponse<CouponResponse> deactivate(@PathVariable UUID id) {
        return ApiResponse.ok(couponService.deactivateCoupon(id));
    }

    @GetMapping("/validate")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @Operation(summary = "Validate coupon and calculate discount")
    public ApiResponse<ApplyCouponResponse> validate(
            @RequestParam String code,
            @RequestParam BigDecimal orderSubtotal) {
        return ApiResponse.ok(couponService.validateAndCalculate(code, orderSubtotal));
    }
}
