package com.commercehub.inventory.repository;

import com.commercehub.inventory.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID>, JpaSpecificationExecutor<StockItem> {

    Optional<StockItem> findByProductIdAndWarehouseId(UUID productId, UUID warehouseId);

    List<StockItem> findAllByProductId(UUID productId);

    @Query("SELECT s FROM StockItem s WHERE s.quantityOnHand <= s.lowStockThreshold")
    List<StockItem> findLowStockItems();
}
