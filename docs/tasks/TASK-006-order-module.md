# TASK-006 — Order Management Module

**Priority:** High  
**Estimated Effort:** Large  
**Depends On:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005  
**Module:** `commercehub-order`

---

## Objective

Implement the complete order lifecycle from cart checkout through delivery. This is the central module of the platform — it orchestrates inventory reservation, cart checkout, order status transitions, and event publishing.

---

## Acceptance Criteria

- [ ] Customer can place an order from their active cart.
- [ ] Order placement is idempotent — duplicate `Idempotency-Key` returns existing order.
- [ ] Stock is reserved at order placement via `InventoryService`.
- [ ] Insufficient stock → `InsufficientStockException` → 409.
- [ ] Order items are price-snapshotted from cart items at placement time.
- [ ] Order total computed in service: `subtotal + shipping + tax - discount`.
- [ ] Order status transitions enforced (only valid transitions allowed).
- [ ] Cancelling an order releases reserved stock.
- [ ] Delivered orders cannot be modified.
- [ ] Full status history recorded on every transition.
- [ ] Admin can view and advance any order.
- [ ] Customer can view and cancel their own pending orders.
- [ ] Order number is human-readable and unique (`ORD-YYYY-NNNNNN`).
- [ ] `OrderPlacedEvent` published on successful order — consumed by Notifications.
- [ ] Unit and integration tests cover all state transitions.

---

## Sub-Tasks

### 6.1 — Flyway Migrations

- `V5.0.0__create_orders_table.sql`
- `V5.0.1__create_order_items_table.sql`
- `V5.0.2__create_order_status_history_table.sql`
- `V5.0.3__create_order_number_sequence.sql` — PostgreSQL `CREATE SEQUENCE order_number_seq`

### 6.2 — Entities

**`Order`** (`@Entity`, `@Table(name = "orders")`):
- `id: UUID`
- `orderNumber: String` (unique, generated from sequence)
- `customerId: UUID` (reference — no JPA join to identity module)
- `status: OrderStatus` (stored as String)
- `items: List<OrderItem>` — `@OneToMany(cascade = ALL, orphanRemoval = true)`
- Shipping address fields (denormalized snapshot — not a FK)
- `subtotal`, `discountAmount`, `shippingCost`, `taxAmount`, `totalAmount: BigDecimal`
- `appliedCoupon: String` (nullable)
- `idempotencyKey: String` (unique, nullable)
- `statusHistory: List<OrderStatusHistory>` — `@OneToMany(cascade = ALL)`
- Extends `AuditableEntity`
- Business method: `canTransitionTo(OrderStatus next): boolean` — encodes valid transition graph

**`OrderItem`** (`@Entity`, `@Table(name = "order_items")`):
- `id: UUID`
- `order: Order (ManyToOne)`
- `productId: UUID` (snapshot reference — no FK)
- `productName: String` (snapshot)
- `sku: String` (snapshot)
- `quantity: int`
- `unitPrice: BigDecimal` (snapshot)
- `lineTotal: BigDecimal` (snapshot — quantity × unitPrice)

**`OrderStatusHistory`** (`@Entity`, `@Table(name = "order_status_history")`):
- `id: UUID`
- `order: Order (ManyToOne)`
- `fromStatus: OrderStatus` (nullable — null for initial creation)
- `toStatus: OrderStatus`
- `changedByUserId: UUID` (nullable)
- `note: String`
- `changedAt: Instant`

**`OrderStatus`** (enum):
```java
CREATED, PENDING_PAYMENT, PAID, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
```

Valid transition map (in `Order` entity or a `OrderStateMachine` utility class):
```
CREATED → [PENDING_PAYMENT, CANCELLED]
PENDING_PAYMENT → [PAID, CANCELLED]
PAID → [PROCESSING, REFUNDED]
PROCESSING → [PACKED, CANCELLED]
PACKED → [SHIPPED]
SHIPPED → [DELIVERED]
DELIVERED → [REFUNDED]
CANCELLED → [] (terminal)
REFUNDED → [] (terminal)
```

### 6.3 — Repositories

**`OrderRepository`**:
- `findByIdAndCustomerId(UUID id, UUID customerId): Optional<Order>`
- `findByOrderNumber(String orderNumber): Optional<Order>`
- `findByIdempotencyKey(String key): Optional<Order>`
- `findAllByCustomerId(UUID customerId, Pageable pageable): Page<Order>`
- `findAll(Specification<Order> spec, Pageable pageable): Page<Order>` — for admin filters

**`OrderSpecification`** (static factory):
- `hasStatus(OrderStatus status)`
- `hasCustomerId(UUID customerId)`
- `createdAfter(Instant date)`
- `createdBefore(Instant date)`

### 6.4 — DTOs

**Requests:**
- `PlaceOrderRequest` — `shippingAddressId` (@NotNull), `couponCode` (nullable)
- `UpdateOrderStatusRequest` — `status` (@NotNull), `note` (nullable)
- `CancelOrderRequest` — `reason` (@NotBlank)

**Responses:**
- `OrderResponse` — all order fields + `items: List<OrderItemResponse>` + `statusHistory: List<OrderStatusHistoryResponse>`
- `OrderSummaryResponse` — `id`, `orderNumber`, `status`, `totalAmount`, `itemCount`, `createdAt`
- `OrderItemResponse` — `productId`, `productName`, `sku`, `quantity`, `unitPrice`, `lineTotal`
- `OrderStatusHistoryResponse` — `fromStatus`, `toStatus`, `changedByUserId`, `note`, `changedAt`

### 6.5 — Mapper

`OrderMapper` (MapStruct):
- `toResponse(Order): OrderResponse`
- `toSummaryResponse(Order): OrderSummaryResponse`
- `toItemResponse(OrderItem): OrderItemResponse`
- `toHistoryResponse(OrderStatusHistory): OrderStatusHistoryResponse`

### 6.6 — Order Number Generation

Strategy: `ORD-{YEAR}-{PADDED_SEQUENCE}`
Example: `ORD-2024-000001`

Options:
- PostgreSQL sequence `order_number_seq` — call `NEXTVAL('order_number_seq')` via native query in repository.
- Method in `OrderRepository`: `@Query(value = "SELECT nextval('order_number_seq')", nativeQuery = true) Long nextOrderSequence()`
- Format in service: `"ORD-%d-%06d".formatted(Year.now().getValue(), seq)`

### 6.7 — Services

**`OrderService` interface + `OrderServiceImpl`:**

```
placeOrder(UUID customerId, PlaceOrderRequest) → OrderResponse
  @Transactional
  1. Check idempotencyKey — if order with same key exists → return existing order (idempotent)
  2. Get customer's ACTIVE cart via CartService → BusinessException if cart empty
  3. For each cart item: verify product still ACTIVE via ProductService
  4. Build List<StockReservationRequest> from cart items
  5. Call InventoryService.reserveStock(orderId, items) → InsufficientStockException propagates
  6. Resolve shipping address from AddressService / identity module
  7. Compute order totals:
       subtotal = sum of (cartItem.unitPrice × quantity)
       discountAmount = cart.discountAmount
       shippingCost = ShippingService.calculateCost(items, address) [stub: 0 for phase 1]
       taxAmount = TaxService.calculate(subtotal) [stub: 0 for phase 1]
       totalAmount = subtotal + shippingCost + taxAmount - discountAmount
  8. Generate order number via repository sequence
  9. Create Order entity with status=CREATED
  10. Create OrderItems (snapshot productId, productName, sku, unitPrice, quantity, lineTotal)
  11. Create initial OrderStatusHistory entry (null → CREATED)
  12. Save order
  13. Call CartService.checkoutCart(customerId) to mark cart as CHECKED_OUT
  14. Publish OrderPlacedEvent
  15. Return OrderResponse

getOrderById(UUID orderId, UUID requestingUserId, boolean isAdmin) → OrderResponse
  1. If admin: findById → 404 if not found
  2. If customer: findByIdAndCustomerId → 404 if not found or doesn't belong to customer

getMyOrders(UUID customerId, Pageable) → Page<OrderSummaryResponse>

getAllOrders(Specification, Pageable) → Page<OrderSummaryResponse>  [ADMIN]

cancelOrder(UUID orderId, UUID requestingUserId, boolean isAdmin, CancelOrderRequest) → OrderResponse
  @Transactional
  1. Find order (with ownership check if not admin)
  2. Verify order can transition to CANCELLED → InvalidOrderStateException
  3. Call InventoryService.releaseReservation(orderId)
  4. Transition status to CANCELLED
  5. Add status history entry with reason as note
  6. Save
  7. Publish OrderCancelledEvent
  8. Return response

advanceOrderStatus(UUID orderId, UpdateOrderStatusRequest, UUID actingUserId) → OrderResponse  [ADMIN/WAREHOUSE]
  @Transactional
  1. Find order → 404
  2. Verify valid transition → InvalidOrderStateException if invalid
  3. If transition to SHIPPED: call InventoryService.fulfillReservation(orderId)
  4. Transition status, add history entry
  5. Save
  6. Publish appropriate event (OrderShippedEvent, OrderDeliveredEvent)
  7. Return response

getOrderHistory(UUID orderId) → List<OrderStatusHistoryResponse>
```

### 6.8 — Controllers

**`OrderController`** (`/api/v1/orders`):

- `POST /` — `@PreAuthorize("hasRole('CUSTOMER')")`, requires `Idempotency-Key` header (@RequestHeader)
- `GET /` — `@PreAuthorize("hasRole('CUSTOMER')")` — own orders
- `GET /{id}` — `@PreAuthorize("isAuthenticated()")` — service enforces ownership
- `POST /{id}/cancel` — `@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'SUPPORT')")`
- `GET /admin` — `@PreAuthorize("hasRole('ADMIN')")` — all orders with filters
- `PATCH /{id}/status` — `@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")`
- `GET /{id}/history` — `@PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")`

### 6.9 — Events

- `OrderPlacedEvent` — `orderId`, `customerId`, `orderNumber`, `totalAmount`, `items` (for notification)
- `OrderCancelledEvent` — `orderId`, `customerId`, `orderNumber`
- `OrderShippedEvent` — `orderId`, `customerId`, `trackingNumber` (from shipping module)
- `OrderDeliveredEvent` — `orderId`, `customerId`
- All consumed by `NotificationEventListener` in notifications module (async).

### 6.10 — Tests

**Unit Tests (`OrderServiceImplTest`):**
- `placeOrder`: success path, idempotent duplicate key, empty cart, insufficient stock
- `cancelOrder`: valid cancellation, invalid state transition, customer cancelling other's order
- `advanceOrderStatus`: all valid transitions, invalid transition rejected
- Status transition map: test every allowed and disallowed transition
- Order total calculation: all components (subtotal, discount, shipping, tax)

**Integration Tests (`OrderControllerIT`):**
- Place order end-to-end (register → login → add to cart → place order)
- Idempotency: same `Idempotency-Key` → same order returned
- Insufficient stock → 409
- Cancel order: stock released (verify inventory)
- Admin advancing status through full lifecycle
- Customer cannot view another customer's order → 404

---

## Business Rules Enforced

| Rule | Where |
|------|-------|
| Order placed only if stock available | `InventoryService.reserveStock` in `placeOrder` |
| Stock reserved on order placement | `InventoryService.reserveStock` in `placeOrder` |
| Stock released on cancellation | `InventoryService.releaseReservation` in `cancelOrder` |
| Stock fulfilled on shipment | `InventoryService.fulfillReservation` in `advanceOrderStatus` |
| Only valid status transitions | `Order.canTransitionTo()` checked in service |
| Delivered orders immutable | Terminal states checked in transition guard |
| Price and product data snapshotted | `OrderItem` contains denormalized data, no FK to catalog |
| Order placement idempotent | `idempotencyKey` unique constraint + service pre-check |
| Customer can only see own orders | `findByIdAndCustomerId` in non-admin flow |
