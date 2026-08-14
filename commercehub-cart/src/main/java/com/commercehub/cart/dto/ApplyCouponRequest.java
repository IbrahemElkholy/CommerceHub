package com.commercehub.cart.dto;

import jakarta.validation.constraints.NotBlank;

public record ApplyCouponRequest(@NotBlank String couponCode) {}
