package com.commercehub.inventory.repository;

import com.commercehub.inventory.entity.ReservationStatus;
import com.commercehub.inventory.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {

    List<StockReservation> findByOrderIdAndStatus(UUID orderId, ReservationStatus status);

    List<StockReservation> findByStockItemIdAndStatus(UUID stockItemId, ReservationStatus status);
}
