# TASK-004 — Inventory Module

**Priority:** High  
**Estimated Effort:** Large  
**Depends On:** TASK-001, TASK-002, TASK-003  
**Module:** `commercehub-inventory`

---

## Objective

Build the inventory system that tracks stock per product per warehouse, handles reservations to prevent overselling, supports adjustments with a full audit trail, and emits low-stock alerts.

---

## Acceptance Criteria

- [ ] Warehouse CRUD for admins.
- [ ] Stock items tracked per product per warehouse.
- [ ] `quantityAvailable` is always `quantityOnHand - quantityReserved` — never negative.
- [ ] Reserving more than available stock throws `InsufficientStockException`.
- [ ] Stock reservations linked to order IDs — releasable individually.
- [ ] Every stock adjustment logged with reason and acting user.
- [ ] Low stock alert event published when quantity drops below threshold.
- [ ] `InventoryService` interface usable by Order module without coupling to inventory internals.
- [ ] Optimistic locking on `StockItem` to handle concurrent reservation attempts.
- [ ] All endpoints secured (ADMIN or WAREHOUSE role).
- [ ] Unit and integration tests cover all scenarios including concurrent reservation.

---

## Sub-Tasks

### 4.1 — Flyway Migrations

- `V3.0.0__create_warehouses_table.sql`
- `V3.0.1__create_stock_items_table.sql`
- `V3.0.2__create_stock_reservations_table.sql`
- `V3.0.3__create_stock_adjustments_table.sql`

### 4.2 — Entities

**`Warehouse`** (`@Entity`, `@Table(name = "warehouses")`):
- `id: UUID`, `name: String`, `code: String` (unique), `address: String`, `active: boolean`

**`StockItem`** (`@Entity`, `@Table(name = "stock_items")`):
- `id: UUID`
- `product: Product` — `@ManyToOne(fetch = LAZY)` — only store `productId` if catalog is later extracted; for now JPA join is fine.
- `warehouse: Warehouse` — `@ManyToOne(fetch = LAZY)`
- `quantityOnHand: int` (CHECK >= 0)
- `quantityReserved: int` (CHECK >= 0)
- `lowStockThreshold: int`
- `version: Long` — `@Version` for optimistic locking
- Business method on entity: `getQuantityAvailable(): int` — `return quantityOnHand - quantityReserved`
- Unique constraint: `(product_id, warehouse_id)`

**`StockReservation`** (`@Entity`, `@Table(name = "stock_reservations")`):
- `id: UUID`, `stockItem: StockItem (ManyToOne)`, `orderId: UUID`, `quantityReserved: int`, `status: ReservationStatus`

**`StockAdjustment`** (`@Entity`, `@Table(name = "stock_adjustments")`):
- `id: UUID`, `stockItem: StockItem (ManyToOne)`, `adjustedBy: UUID` (user id reference — no FK to keep modules loosely coupled), `quantityDelta: int`, `reason: String`, `createdAt: Instant`

**`ReservationStatus`** (enum): `ACTIVE`, `RELEASED`, `FULFILLED`

### 4.3 — Repositories

**`WarehouseRepository`**:
- `findByCode(String code): Optional<Warehouse>`
- `findAllByActive(boolean active): List<Warehouse>`

**`StockItemRepository`**:
- `findByProductIdAndWarehouseId(UUID productId, UUID warehouseId): Optional<StockItem>`
- `findAllByProductId(UUID productId): List<StockItem>`
- `findAllByQuantityOnHandLessThanEqualLowStockThreshold(Pageable): Page<StockItem>` — native query or JPQL
- `findAll(Specification<StockItem> spec, Pageable pageable): Page<StockItem>`

**`StockReservationRepository`**:
- `findByOrderIdAndStatus(UUID orderId, ReservationStatus status): List<StockReservation>`
- `findByStockItemIdAndStatus(UUID stockItemId, ReservationStatus status): List<StockReservation>`

**`StockAdjustmentRepository`**:
- `findAllByStockItemId(UUID stockItemId, Pageable pageable): Page<StockAdjustment>`

### 4.4 — DTOs

**Requests:**
- `CreateWarehouseRequest` — `name` (@NotBlank), `code` (@NotBlank), `address`
- `UpdateWarehouseRequest` — same, all optional
- `StockAdjustmentRequest` — `productId` (@NotNull), `warehouseId` (@NotNull), `quantityDelta` (@NotNull, non-zero), `reason` (@NotBlank)
- `SetLowStockThresholdRequest` — `productId`, `warehouseId`, `threshold` (@Min(0))

**Responses:**
- `WarehouseResponse` — all fields
- `StockItemResponse` — `productId`, `productName` (resolved), `warehouseId`, `warehouseName`, `quantityOnHand`, `quantityReserved`, `quantityAvailable`, `lowStockThreshold`
- `StockAdjustmentResponse` — `id`, `quantityDelta`, `reason`, `adjustedByUserId`, `createdAt`

### 4.5 — Service Interface (used by other modules)

```java
public interface InventoryService {

    /**
     * Reserve stock for an order.
     * Throws InsufficientStockException if available qty < requested qty for any item.
     * This method is transactional and uses optimistic locking.
     */
    void reserveStock(UUID orderId, List<StockReservationRequest> items);

    /**
     * Release all ACTIVE reservations for the given orderId (e.g., on order cancellation).
     */
    void releaseReservation(UUID orderId);

    /**
     * Mark reservations as FULFILLED when order is shipped.
     * Reduces quantityOnHand permanently.
     */
    void fulfillReservation(UUID orderId);

    /**
     * Check if sufficient stock is available without reserving.
     */
    boolean isStockAvailable(UUID productId, int quantity);

    /**
     * Get available stock quantity for a product (across all warehouses).
     */
    int getAvailableStock(UUID productId);
}
```

### 4.6 — Service Implementation Detail

**`reserveStock(UUID orderId, List<StockReservationRequest> items)`:**
```
@Transactional
For each item in request:
  1. Find StockItem by productId (pick warehouse with most available stock, or first active warehouse)
  2. Lock with optimistic locking (caught ObjectOptimisticLockingFailureException → retry up to 3x, then throw InsufficientStockException)
  3. Check quantityAvailable >= requested → InsufficientStockException with detail message
  4. stockItem.quantityReserved += quantity
  5. Save StockItem
  6. Create StockReservation(orderId, quantity, ACTIVE)
  7. If quantityAvailable drops below lowStockThreshold → publish LowStockEvent
```

**`releaseReservation(UUID orderId)`:**
```
@Transactional
1. Find all ACTIVE reservations for orderId
2. For each:
   a. stockItem.quantityReserved -= reservation.quantityReserved
   b. reservation.status = RELEASED
3. Save all
```

**`fulfillReservation(UUID orderId)`:**
```
@Transactional
1. Find all ACTIVE reservations for orderId
2. For each:
   a. stockItem.quantityOnHand -= reservation.quantityReserved
   b. stockItem.quantityReserved -= reservation.quantityReserved
   c. reservation.status = FULFILLED
3. Save all
```

**`adjustStock(StockAdjustmentRequest, UUID actingUserId)`:**
```
@Transactional
1. Find StockItem by productId + warehouseId → 404 if not found
2. Compute new quantityOnHand = current + delta
3. If new quantityOnHand < 0 → throw BusinessException("Cannot reduce stock below zero")
4. Apply delta to quantityOnHand
5. Save StockItem
6. Create StockAdjustment audit record
7. If new qty below threshold → publish LowStockEvent
```

### 4.7 — Controllers

**`WarehouseController`** (`/api/v1/inventory/warehouses`):
- All endpoints: `@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")`
- CRUD: GET (list), GET /{id}, POST, PUT /{id}, PATCH /{id}/status

**`StockController`** (`/api/v1/inventory/stock`):
- `GET /` — list all stock items (paged, filterable by warehouse, product)
- `GET /{productId}` — stock for a specific product across all warehouses
- `POST /adjust` — `@PreAuthorize("hasRole('WAREHOUSE')")` — adjust quantity
- `GET /low` — list stock items below threshold
- `GET /adjustments` — audit log of all adjustments (ADMIN only)

### 4.8 — Events

**`LowStockEvent`** (Spring `ApplicationEvent`):
- `productId: UUID`, `productName: String`, `warehouseId: UUID`, `currentAvailable: int`, `threshold: int`
- Published by `InventoryServiceImpl`
- Consumed by `NotificationEventListener` (in notifications module — async `@EventListener`)

### 4.9 — Tests

**Unit Tests:**
- `InventoryServiceImplTest`
  - `reserveStock`: success, insufficient stock, optimistic lock retry
  - `releaseReservation`: verifies quantities restored
  - `fulfillReservation`: verifies on-hand reduced correctly
  - `adjustStock`: positive delta, negative delta, negative-to-below-zero blocked
  - Low stock event published when threshold crossed

**Integration Tests:**
- `StockControllerIT`
  - Full CRUD warehouses
  - Stock adjustment recorded in audit log
  - Concurrent reservation test: two threads racing to reserve same stock — only one succeeds

---

## Business Rules Enforced

| Rule | Where |
|------|-------|
| Stock never negative | `adjustStock` pre-check; DB CHECK constraint |
| Reserved never exceeds on-hand | `reserveStock` check before incrementing |
| Every stock change audited | `StockAdjustment` created for every `adjustStock` call |
| Optimistic locking on reservation | `@Version` on `StockItem` + retry logic |
| Low stock alert on threshold crossing | `LowStockEvent` published in service |
