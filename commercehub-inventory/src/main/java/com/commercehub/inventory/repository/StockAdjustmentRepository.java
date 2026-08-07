package com.commercehub.inventory.repository;

import com.commercehub.inventory.entity.StockAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, UUID> {

    Page<StockAdjustment> findAllByStockItemId(UUID stockItemId, Pageable pageable);
}
