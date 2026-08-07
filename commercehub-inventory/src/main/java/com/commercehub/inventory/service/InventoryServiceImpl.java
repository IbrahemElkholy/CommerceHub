package com.commercehub.inventory.service;

import com.commercehub.common.exception.BusinessException;
import com.commercehub.common.exception.InsufficientStockException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.inventory.dto.StockAdjustmentRequest;
import com.commercehub.inventory.dto.StockReservationRequest;
import com.commercehub.inventory.entity.ReservationStatus;
import com.commercehub.inventory.entity.StockAdjustment;
import com.commercehub.inventory.entity.StockItem;
import com.commercehub.inventory.entity.StockReservation;
import com.commercehub.inventory.event.LowStockEvent;
import com.commercehub.inventory.repository.StockAdjustmentRepository;
import com.commercehub.inventory.repository.StockItemRepository;
import com.commercehub.inventory.repository.StockReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryServiceImpl implements InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryServiceImpl.class);
    private static final int MAX_RETRIES = 3;

    private final StockItemRepository stockItemRepository;
    private final StockReservationRepository reservationRepository;
    private final StockAdjustmentRepository adjustmentRepository;
    private final ApplicationEventPublisher eventPublisher;

    public InventoryServiceImpl(StockItemRepository stockItemRepository,
                                StockReservationRepository reservationRepository,
                                StockAdjustmentRepository adjustmentRepository,
                                ApplicationEventPublisher eventPublisher) {
        this.stockItemRepository = stockItemRepository;
        this.reservationRepository = reservationRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public void reserveStock(UUID orderId, List<StockReservationRequest> items) {
        for (StockReservationRequest item : items) {
            reserveWithRetry(orderId, item, MAX_RETRIES);
        }
    }

    private void reserveWithRetry(UUID orderId, StockReservationRequest item, int retriesLeft) {
        try {
            List<StockItem> stockItems = stockItemRepository.findAllByProductId(item.productId());
            StockItem stockItem = stockItems.stream()
                    .filter(s -> s.getWarehouse().isActive())
                    .max(java.util.Comparator.comparingInt(StockItem::getQuantityAvailable))
                    .orElseThrow(() -> new InsufficientStockException(
                            "No stock available for product: " + item.productId()));

            if (stockItem.getQuantityAvailable() < item.quantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for product " + item.productId() +
                        ": requested=" + item.quantity() + ", available=" + stockItem.getQuantityAvailable());
            }

            stockItem.setQuantityReserved(stockItem.getQuantityReserved() + item.quantity());
            stockItem.setUpdatedAt(Instant.now());
            stockItemRepository.save(stockItem);

            StockReservation reservation = new StockReservation();
            reservation.setStockItem(stockItem);
            reservation.setOrderId(orderId);
            reservation.setQuantityReserved(item.quantity());
            reservation.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(reservation);

            if (stockItem.getQuantityAvailable() <= stockItem.getLowStockThreshold()) {
                eventPublisher.publishEvent(new LowStockEvent(
                        item.productId(),
                        stockItem.getWarehouse().getId(),
                        stockItem.getQuantityAvailable(),
                        stockItem.getLowStockThreshold()));
            }
        } catch (ObjectOptimisticLockingFailureException e) {
            if (retriesLeft > 0) {
                log.warn("Optimistic lock conflict for product {}, retrying ({} left)", item.productId(), retriesLeft);
                reserveWithRetry(orderId, item, retriesLeft - 1);
            } else {
                throw new InsufficientStockException("Could not reserve stock due to concurrency conflict");
            }
        }
    }

    @Override
    @Transactional
    public void releaseReservation(UUID orderId) {
        List<StockReservation> reservations = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.ACTIVE);
        for (StockReservation res : reservations) {
            StockItem stockItem = res.getStockItem();
            stockItem.setQuantityReserved(stockItem.getQuantityReserved() - res.getQuantityReserved());
            stockItem.setUpdatedAt(Instant.now());
            stockItemRepository.save(stockItem);
            res.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(res);
        }
    }

    @Override
    @Transactional
    public void fulfillReservation(UUID orderId) {
        List<StockReservation> reservations = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.ACTIVE);
        for (StockReservation res : reservations) {
            StockItem stockItem = res.getStockItem();
            stockItem.setQuantityOnHand(stockItem.getQuantityOnHand() - res.getQuantityReserved());
            stockItem.setQuantityReserved(stockItem.getQuantityReserved() - res.getQuantityReserved());
            stockItem.setUpdatedAt(Instant.now());
            stockItemRepository.save(stockItem);
            res.setStatus(ReservationStatus.FULFILLED);
            reservationRepository.save(res);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isStockAvailable(UUID productId, int quantity) {
        return getAvailableStock(productId) >= quantity;
    }

    @Override
    @Transactional(readOnly = true)
    public int getAvailableStock(UUID productId) {
        return stockItemRepository.findAllByProductId(productId).stream()
                .mapToInt(StockItem::getQuantityAvailable)
                .sum();
    }

    @Transactional
    public void adjustStock(StockAdjustmentRequest request, UUID actingUserId) {
        StockItem stockItem = stockItemRepository
                .findByProductIdAndWarehouseId(request.productId(), request.warehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        int newQty = stockItem.getQuantityOnHand() + request.quantityDelta();
        if (newQty < 0) {
            throw new BusinessException("INVALID_STOCK_ADJUSTMENT", "Cannot reduce stock below zero") {};
        }
        stockItem.setQuantityOnHand(newQty);
        stockItem.setUpdatedAt(Instant.now());
        stockItemRepository.save(stockItem);

        StockAdjustment audit = new StockAdjustment();
        audit.setStockItem(stockItem);
        audit.setAdjustedBy(actingUserId);
        audit.setQuantityDelta(request.quantityDelta());
        audit.setReason(request.reason());
        adjustmentRepository.save(audit);

        if (stockItem.getQuantityAvailable() <= stockItem.getLowStockThreshold()) {
            eventPublisher.publishEvent(new LowStockEvent(
                    request.productId(),
                    stockItem.getWarehouse().getId(),
                    stockItem.getQuantityAvailable(),
                    stockItem.getLowStockThreshold()));
        }
        log.info("Stock adjusted: productId={}, delta={}, by={}", request.productId(), request.quantityDelta(), actingUserId);
    }
}
