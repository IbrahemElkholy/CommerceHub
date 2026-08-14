# TASK-007 — Remaining Modules (Reviews, Wishlist, Promotions, Notifications, Analytics, Payment, Shipping)

**Priority:** Medium (after core order flow is working)  
**Depends On:** TASK-001 through TASK-006

---

## TASK-007a — Reviews Module

**Module:** `commercehub-reviews`

### Acceptance Criteria
- [ ] Customer can submit exactly one review per product they have ordered (business rule: only verified purchasers).
- [ ] Review has rating (1-5), title, body.
- [ ] Reviews are in `PENDING` status by default — must be `APPROVED` by admin before public visibility.
- [ ] Public endpoint shows only `APPROVED` reviews.
- [ ] Average rating computed per product (aggregate query).
- [ ] Admin can approve, reject, or delete reviews.

### Key Design Points

**`Review`** entity fields: `id`, `productId`, `customerId`, `orderId` (proof of purchase), `rating`, `title`, `body`, `status`, `createdAt`

**Business rule enforcement:**
- `ReviewService.submitReview()`: verify customer has a `DELIVERED` order containing the `productId` before allowing submission → `BusinessException("You can only review products you have purchased")` otherwise.
- One review per `(customerId, productId)` — enforced by DB unique constraint.

**Flyway:** `V9.0.0__create_reviews_table.sql`

**Endpoints:**
- `GET /api/v1/catalog/products/{id}/reviews` — public, paginated, only APPROVED
- `POST /api/v1/catalog/products/{id}/reviews` — CUSTOMER (with proof-of-purchase check)
- `PATCH /api/v1/reviews/{id}/status` — ADMIN
- `DELETE /api/v1/reviews/{id}` — ADMIN

**Tests:** Unit test proof-of-purchase validation. Integration test full submit → approve → visible flow.

---

## TASK-007b — Wishlist Module

**Module:** `commercehub-wishlist`

### Acceptance Criteria
- [ ] Customer can add/remove products to/from wishlist.
- [ ] Duplicate add is idempotent (no error — return current wishlist).
- [ ] Wishlist shows product summary (name, image, price, availability).

### Key Design Points

**`WishlistItem`** entity: `id`, `userId`, `productId`, `createdAt`. Unique `(userId, productId)`.

**`WishlistService.addItem()`**: If already exists, return current list without error (use `findByUserIdAndProductId` first, or catch `DataIntegrityViolationException` gracefully).

**`WishlistService.getWishlist()`**: For each wishlistItem, call `ProductService.getProductById()` to resolve product details. Return enriched `WishlistItemResponse`.

**Flyway:** `V12.0.0__create_wishlist_items_table.sql`

**Endpoints:** `GET /api/v1/wishlist`, `POST /api/v1/wishlist/{productId}`, `DELETE /api/v1/wishlist/{productId}` — all CUSTOMER only.

---

## TASK-007c — Promotions Module

**Module:** `commercehub-promotions`

### Acceptance Criteria
- [ ] Admin can create promotions of types: `PERCENTAGE`, `FIXED_AMOUNT`, `BOGO`, `FLASH_SALE`.
- [ ] Admin can generate coupon codes tied to a promotion.
- [ ] Coupon validation endpoint returns discount amount or reason for rejection.
- [ ] Expired, inactive, or exhausted coupons rejected.
- [ ] A coupon's `maxUses` is enforced (not exceeded — use DB constraint or atomic increment check).

### Key Design Points

**Entities:**
- `Promotion`: `id`, `name`, `type`, `discountValue`, `minimumOrderAmount`, `maxUsageCount`, `usageCount`, `startDate`, `endDate`, `status`
- `Coupon`: `id`, `promotionId`, `code` (unique), `maxUses`, `currentUses`

**`PromotionService.validateCoupon(String code, BigDecimal cartSubtotal)`**:
1. Find coupon by code → `BusinessException("Invalid coupon")` if not found
2. Load linked promotion
3. Check promotion `status == ACTIVE` → reject if not
4. Check `now()` between `startDate` and `endDate` → reject if expired
5. Check `coupon.currentUses < coupon.maxUses` (if maxUses set) → reject if exhausted
6. Check `cartSubtotal >= promotion.minimumOrderAmount` (if set) → reject if below minimum
7. Compute and return `DiscountResult(discountAmount, couponCode)`

**Coupon code generation:** Generate random alphanumeric 8-char codes, uppercase, check uniqueness before persist.

**Flyway:** `V10.0.0__create_promotions_table.sql`, `V10.0.1__create_coupons_table.sql`

**Endpoints:**
- `GET /api/v1/promotions` — ADMIN
- `POST /api/v1/promotions` — ADMIN
- `PATCH /api/v1/promotions/{id}/status` — ADMIN
- `POST /api/v1/promotions/{id}/coupons` — ADMIN (generates N coupon codes)
- `POST /api/v1/promotions/validate` — CUSTOMER (validate + preview discount)

---

## TASK-007d — Notifications Module

**Module:** `commercehub-notifications`

### Acceptance Criteria
- [ ] Listens to domain events: `OrderPlacedEvent`, `OrderCancelledEvent`, `OrderShippedEvent`, `LowStockEvent`, `UserRegisteredEvent`.
- [ ] Sends email via configured SMTP (Mailhog in dev, real SMTP in prod).
- [ ] Notification sending is async — does not block the originating transaction.
- [ ] Failed notifications are logged (retry mechanism is a future enhancement).
- [ ] Templates externalized (not hardcoded HTML in Java).

### Key Design Points

**`NotificationEventListener`** (`@Component`):
- Methods annotated `@EventListener` + `@Async`
- Dispatches to appropriate `NotificationSender`

**`EmailNotificationSender`** (uses Spring Mail `JavaMailSender`):
- Loads HTML templates from `src/main/resources/templates/`
- Uses `Thymeleaf` for template rendering (add to common deps)
- Templates: `order-placed.html`, `order-cancelled.html`, `order-shipped.html`, `welcome.html`, `password-reset.html`

**`@Async` configuration:** `@EnableAsync` on config class, custom `ThreadPoolTaskExecutor` bean named `notificationExecutor` with configurable pool size.

**Flyway:** `V8.0.0__create_notification_logs_table.sql` — log every sent notification: `id`, `recipientEmail`, `type`, `status`, `sentAt`, `errorMessage`.

**Tests:** Unit test `NotificationEventListener` — verify correct sender called for each event type. Integration test with Mailhog: send event → verify email received via Mailhog API.

---

## TASK-007e — Analytics Module

**Module:** `commercehub-analytics`

### Acceptance Criteria
- [ ] All analytics endpoints restricted to ADMIN.
- [ ] Revenue report by date range.
- [ ] Top-selling products by quantity and revenue.
- [ ] Orders grouped by status.
- [ ] New customers over time.

### Key Design Points

All analytics are **read-only**, use JPQL or native queries directly on existing tables. No new entities.

`@Transactional(readOnly = true)` on all service methods.

Use `@Query(nativeQuery = true)` with projections (not entities) for complex aggregations.

**DTOs (projections):**
- `RevenueByDateResponse` — `date: LocalDate`, `revenue: BigDecimal`, `orderCount: long`
- `TopProductResponse` — `productId`, `productName`, `quantitySold`, `revenue`
- `OrderStatusSummaryResponse` — `status: String`, `count: long`

**Repository queries (examples):**
```sql
-- Revenue by day in range
SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as order_count
FROM orders
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
  AND created_at BETWEEN :from AND :to
GROUP BY DATE(created_at)
ORDER BY date;

-- Top selling products
SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as qty_sold, SUM(oi.line_total) as revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY oi.product_id, oi.product_name
ORDER BY qty_sold DESC
LIMIT :limit;
```

**Flyway:** No new tables — queries run against existing order/product/user tables.

**Endpoints:** As defined in `docs/05-api-standards.md` Analytics section.

---

## TASK-007f — Payment Module (Phase 1 Stub)

**Module:** `commercehub-payment`

### Phase 1 Scope (Stub Only)
- No real payment gateway integration yet.
- Orders move from `CREATED` → `PENDING_PAYMENT` → `PAID` manually (by admin or via a simulated payment endpoint).
- Payment model defined so Phase 2 Stripe/PayPal integration requires only adding gateway adapters.

### Entities (stub)
**`Payment`** (`@Entity`):
- `id: UUID`, `orderId: UUID`, `amount: BigDecimal`, `currency: String`, `status: PaymentStatus`, `gatewayTransactionId: String` (nullable in phase 1), `createdAt: Instant`

**`PaymentStatus`** (enum): `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

**Flyway:** `V6.0.0__create_payments_table.sql`

**Phase 1 Endpoint:**
- `POST /api/v1/payments/simulate` — ADMIN only — marks an order as PAID (for testing the full order flow in phase 1)

### Phase 2 Design Notes
- Create `PaymentGateway` interface with `charge(PaymentRequest): PaymentResult`
- Implement `StripePaymentGateway` and `PayPalPaymentGateway`
- Strategy pattern: gateway selected by config property
- Webhook endpoint for async payment confirmation

---

## TASK-007g — Shipping Module (Phase 1 Stub)

**Module:** `commercehub-shipping`

### Phase 1 Scope (Stub Only)
- Manual tracking number assignment by warehouse staff.
- Shipping cost = 0 (free shipping stub) or fixed flat rate from config.

### Entities (stub)
**`Shipment`** (`@Entity`):
- `id: UUID`, `orderId: UUID`, `trackingNumber: String`, `carrier: String`, `status: ShipmentStatus`, `shippedAt: Instant`, `estimatedDelivery: LocalDate`

**`ShipmentStatus`** (enum): `PENDING`, `SHIPPED`, `IN_TRANSIT`, `DELIVERED`, `RETURNED`

**Flyway:** `V7.0.0__create_shipments_table.sql`

**`ShippingService` interface** (used by Order module):
- `calculateCost(List<OrderItem>, Address): BigDecimal` — stub returns configured flat rate
- `createShipment(UUID orderId, String trackingNumber): ShipmentResponse`
- `getShipmentByOrderId(UUID orderId): ShipmentResponse`

**Endpoints:**
- `POST /api/v1/shipping/shipments` — WAREHOUSE — create shipment with tracking number
- `GET /api/v1/shipping/shipments/{orderId}` — CUSTOMER/ADMIN/WAREHOUSE

---

## Shared Implementation Notes for All Remaining Modules

1. **Every module** must have its own `README.md` explaining its purpose, endpoints, and how to run tests.
2. **Every controller endpoint** must have `@Operation` and `@ApiResponse` Swagger annotations.
3. **Every service method** that modifies data must be `@Transactional`.
4. **Every read-only service method** should be `@Transactional(readOnly = true)`.
5. **All modules** follow the same package structure: `controller`, `dto`, `entity`, `repository`, `service`, `mapper`, `event`.
6. **No module** may import another module's repository or entity directly — only service interfaces.
