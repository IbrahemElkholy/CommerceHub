# TASK-005 — Shopping Cart Module

**Priority:** High  
**Estimated Effort:** Medium  
**Depends On:** TASK-001, TASK-002, TASK-003  
**Module:** `commercehub-cart`

---

## Objective

Implement the shopping cart allowing customers to build their order before checkout. Cart is persistent (stored in DB, not session), prices are snapshotted at time of adding, and a customer can only have one active cart at a time.

---

## Acceptance Criteria

- [ ] Customer can add products to cart.
- [ ] Adding an already-present product updates quantity instead of creating a duplicate line.
- [ ] Inactive or deleted products cannot be added.
- [ ] Each customer has exactly one `ACTIVE` cart at any time.
- [ ] Cart subtotal is correctly calculated on every change.
- [ ] Cart item unit price is snapshotted from current product price at time of adding.
- [ ] Customer can update quantity (min: 1, max: configurable), remove item, or clear cart.
- [ ] Coupon code can be applied/removed (validation delegates to Promotions module).
- [ ] Cart is converted to `CHECKED_OUT` status when order is placed (by Order module).
- [ ] All endpoints require CUSTOMER role.
- [ ] Unit and integration tests pass.

---

## Sub-Tasks

### 5.1 — Flyway Migrations

- `V4.0.0__create_carts_table.sql`
- `V4.0.1__create_cart_items_table.sql`

### 5.2 — Entities

**`Cart`** (`@Entity`, `@Table(name = "carts")`):
- `id: UUID`
- `userId: UUID` (no FK join — user is in identity module; reference by ID only)
- `status: CartStatus` — enum: `ACTIVE`, `CHECKED_OUT`, `ABANDONED`
- `items: List<CartItem>` — `@OneToMany(mappedBy = "cart", cascade = ALL, orphanRemoval = true)`
- `couponCode: String` (nullable)
- `discountAmount: BigDecimal` (default 0)
- `updatedAt: Instant` — `@PreUpdate`, `@PrePersist` sets this
- Business method: `getSubtotal(): BigDecimal` — sum of all `item.getLineTotal()`
- Business method: `getTotalAfterDiscount(): BigDecimal` — subtotal - discountAmount

**`CartItem`** (`@Entity`, `@Table(name = "cart_items")`):
- `id: UUID`
- `cart: Cart` — `@ManyToOne(fetch = LAZY)`
- `productId: UUID` (reference only — no JPA join to catalog module)
- `quantity: int` (CHECK >= 1)
- `unitPrice: BigDecimal` (snapshot from product at add time)
- Business method: `getLineTotal(): BigDecimal` — `unitPrice.multiply(BigDecimal.valueOf(quantity))`
- Unique constraint: `(cart_id, product_id)`

**`CartStatus`** (enum): `ACTIVE`, `CHECKED_OUT`, `ABANDONED`

### 5.3 — Repositories

**`CartRepository`**:
- `findByUserIdAndStatus(UUID userId, CartStatus status): Optional<Cart>`
- `findByUserId(UUID userId): List<Cart>`

**`CartItemRepository`**:
- `findByCartIdAndProductId(UUID cartId, UUID productId): Optional<CartItem>`
- `deleteByCartIdAndProductId(UUID cartId, UUID productId)`

### 5.4 — DTOs

**Requests:**
- `AddToCartRequest` — `productId` (@NotNull), `quantity` (@Min(1) @Max(100))
- `UpdateCartItemRequest` — `quantity` (@Min(1) @Max(100))
- `ApplyCouponRequest` — `couponCode` (@NotBlank)

**Responses:**
- `CartResponse` — `id`, `status`, `items: List<CartItemResponse>`, `subtotal`, `discountAmount`, `totalAfterDiscount`, `couponCode`, `updatedAt`
- `CartItemResponse` — `productId`, `productName`, `productImageUrl`, `quantity`, `unitPrice`, `lineTotal`

> Note: `productName` and `productImageUrl` require a call to `ProductService` to resolve. This is acceptable — the Cart service depends on the Catalog service interface.

### 5.5 — Cart-Catalog Dependency

`CartService` depends on `ProductService` (catalog module) **via its service interface only**:
- Before adding an item: call `ProductService.getProductById()` to verify product exists, is `ACTIVE`, and to snapshot the current price.
- This is the only cross-module dependency — catalog → cart is not allowed.

### 5.6 — Services

**`CartService` interface + `CartServiceImpl`:**

```
getOrCreateCart(UUID userId) → CartResponse
  1. findByUserIdAndStatus(userId, ACTIVE)
  2. If not found: create new Cart with status=ACTIVE
  3. Map to CartResponse (resolve product names via ProductService)

addItem(UUID userId, AddToCartRequest) → CartResponse
  1. Get ACTIVE cart (or create)
  2. Verify product via ProductService → 404 if not found
  3. Verify product status == ACTIVE → throw BusinessException("Cannot add inactive product")
  4. Check if item with productId already exists in cart:
     a. If yes: item.quantity += request.quantity
     b. If no: create new CartItem with unit_price = product.price (snapshot)
  5. Save cart
  6. Return updated CartResponse

updateItemQuantity(UUID userId, UUID productId, int quantity) → CartResponse
  1. Get ACTIVE cart → 404 if none
  2. Find item → 404 if not in cart
  3. item.quantity = quantity
  4. Save
  5. Return CartResponse

removeItem(UUID userId, UUID productId) → CartResponse
  1. Get ACTIVE cart → 404 if none
  2. Find and remove item
  3. Save
  4. Return CartResponse

clearCart(UUID userId)
  1. Get ACTIVE cart → 404 if none
  2. Clear all items
  3. Remove coupon
  4. Save

applyCoupon(UUID userId, ApplyCouponRequest) → CartResponse
  1. Get ACTIVE cart
  2. Validate coupon via PromotionService.validateCoupon(code, cartSubtotal)
     → throws BusinessException with reason if invalid
  3. Apply discount amount to cart
  4. Set couponCode
  5. Save and return

removeCoupon(UUID userId) → CartResponse
  1. Get ACTIVE cart
  2. Clear couponCode, set discountAmount = 0
  3. Save and return

checkoutCart(UUID userId) → Cart (returns entity — used internally by Order module)
  1. Get ACTIVE cart → BusinessException if empty
  2. Verify each item's product still ACTIVE
  3. Set status = CHECKED_OUT
  4. Save and return entity (for Order module to consume)
```

### 5.7 — Controller

**`CartController`** (`/api/v1/cart`):
- All endpoints: `@PreAuthorize("hasRole('CUSTOMER')")`
- Extract `userId` from `SecurityContext` principal (not from URL — customers can only access their own cart)
- `GET /` → `getOrCreateCart`
- `POST /items` → `addItem` with `@Valid @RequestBody AddToCartRequest`
- `PATCH /items/{productId}` → `updateItemQuantity`
- `DELETE /items/{productId}` → `removeItem`
- `DELETE /` → `clearCart`
- `POST /coupon` → `applyCoupon`
- `DELETE /coupon` → `removeCoupon`

### 5.8 — Tests

**Unit Tests (`CartServiceImplTest`):**
- `addItem`: new product → new item, existing product → quantity incremented
- `addItem`: inactive product → exception
- `addItem`: product not found → exception
- `updateItemQuantity`: item not in cart → exception
- `clearCart`: verifies all items removed, coupon cleared
- `applyCoupon`: valid → discount applied; invalid → exception
- `checkoutCart`: empty cart → exception

**Integration Tests (`CartControllerIT`):**
- Full cart flow: add → update → remove → clear
- Duplicate product → quantity merged
- Cart persists across requests (same user, different requests)
- Coupon apply/remove cycle
- Auth guards: unauthenticated → 401, wrong role → 403

---

## Business Rules Enforced

| Rule | Where |
|------|-------|
| One ACTIVE cart per customer | Unique constraint `(user_id, status=ACTIVE)` + service logic |
| Same product → update quantity | `addItem` checks existing CartItem before creating |
| Inactive product cannot be added | `addItem` verifies product status from ProductService |
| Price snapshotted at add time | `CartItem.unitPrice` set from ProductService at add moment |
| Cart prices recalculated on every change | `CartService` recomputes `getSubtotal()` on every mutation |
| Empty cart cannot be checked out | `checkoutCart` validates `items` not empty |
