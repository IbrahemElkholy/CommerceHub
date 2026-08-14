package com.commercehub.promotions.repository;

import com.commercehub.promotions.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    Optional<Coupon> findByCode(String code);

    Page<Coupon> findAllByActive(boolean active, Pageable pageable);
}
