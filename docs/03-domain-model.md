# Domain Model — CommerceHub

## Entity Relationship Overview

```
USER ──────────────────────────── ROLE
 │                                 (many-to-many)
 │
 ├──── ADDRESS (one-to-many)
 │
 ├──── CART ─────────────── CART_ITEM ──── PRODUCT
 │      (one-to-one)         (one-to-many)
 │
 ├──── ORDER ────────────── ORDER_ITEM ─── PRODUCT
 │      (one-to-many)        (one-to-many)
 │         │
 │         ├── ORDER_STATUS_HISTORY
 │         ├── PAYMENT (one-to-one)
 │         └── SHIPMENT (one-to-one)
 │
 ├──── REVIEW ────────────── PRODUCT
 │      (one-to-many)
 │
 └──── WISHLIST_ITEM ─────── PRODUCT
        (one-to-many)


PRODUCT ──── CATEGORY (many-to-many)
PRODUCT ──── BRAND (many-to-one)
PRODUCT ──── PRODUCT_IMAGE (one-to-many)


STOCK_ITEM ──── PRODUCT (many-to-one)
STOCK_ITEM ──── WAREHOUSE (many-to-one)
STOCK_ITEM ──── STOCK_RESERVATION (one-to-many)
STOCK_ITEM ──── STOCK_ADJUSTMENT (one-to-many)


PROMOTION ──── PROMOTION_CONDITION (one-to-many)
PROMOTION ──── COUPON (one-to-many)
ORDER ─────── COUPON (many-to-one, nullable)
```

---

## Core Entities

### User
```
User
├── id: UUID (PK)
├── email: String (unique, not null)
├── passwordHash: String (not null)
├── firstName: String
├── lastName: String
├── phone: String
├── status: UserStatus [ACTIVE, INACTIVE, SUSPENDED]
├── emailVerified: boolean
├── roles: Set<Role> (many-to-many)
├── addresses: List<Address>
├── createdAt: Instant
└── updatedAt: Instant
```

### Role
```
Role
├── id: Long (PK)
├── name: RoleName [CUSTOMER, ADMIN, WAREHOUSE, SUPPORT, SYSTEM_ADMIN]
└── permissions: Set<Permission> (future)
```

### Product
```
Product
├── id: UUID (PK)
├── sku: String (unique, not null)
├── name: String (not null)
├── description: String
├── price: BigDecimal (not null, >= 0)
├── status: ProductStatus [ACTIVE, INACTIVE, DISCONTINUED]
├── brand: Brand (many-to-one)
├── categories: Set<Category> (many-to-many)
├── images: List<ProductImage>
├── weight: BigDecimal
├── dimensions: Dimensions (embedded)
├── createdAt: Instant
└── updatedAt: Instant
```

### Category
```
Category
├── id: Long (PK)
├── name: String (unique, not null)
├── slug: String (unique, not null)
├── description: String
├── parent: Category (self-referential, nullable → subcategories)
└── children: List<Category>
```

### StockItem
```
StockItem
├── id: UUID (PK)
├── product: Product (many-to-one)
├── warehouse: Warehouse (many-to-one)
├── quantityOnHand: int (>= 0)
├── quantityReserved: int (>= 0)
├── quantityAvailable: int (computed: onHand - reserved)
├── lowStockThreshold: int
└── version: Long (optimistic locking)
```

### Cart
```
Cart
├── id: UUID (PK)
├── user: User (one-to-one)
├── status: CartStatus [ACTIVE, CHECKED_OUT, ABANDONED]
├── items: List<CartItem>
├── subtotal: BigDecimal (computed)
├── appliedCoupon: Coupon (nullable)
└── updatedAt: Instant
```

### CartItem
```
CartItem
├── id: UUID (PK)
├── cart: Cart (many-to-one)
├── product: Product (many-to-one)
├── quantity: int (>= 1)
├── unitPrice: BigDecimal (snapshot at time of adding)
└── lineTotal: BigDecimal (computed)
```

### Order
```
Order
├── id: UUID (PK)
├── orderNumber: String (unique, human-readable: ORD-2024-000001)
├── customer: User (many-to-one)
├── status: OrderStatus
├── items: List<OrderItem>
├── shippingAddress: Address (embedded snapshot)
├── subtotal: BigDecimal
├── discountAmount: BigDecimal
├── shippingCost: BigDecimal
├── taxAmount: BigDecimal
├── totalAmount: BigDecimal
├── appliedCoupon: String (coupon code snapshot)
├── statusHistory: List<OrderStatusHistory>
├── idempotencyKey: String (unique)
├── createdAt: Instant
└── updatedAt: Instant
```

### OrderStatus (Enum)
```
CREATED → PENDING_PAYMENT → PAID → PROCESSING → PACKED → SHIPPED → DELIVERED
                                                                  ↘ CANCELLED
                                                                  ↘ REFUNDED
```
Valid transitions (enforced in service):
- `CREATED` → `PENDING_PAYMENT` | `CANCELLED`
- `PENDING_PAYMENT` → `PAID` | `CANCELLED`
- `PAID` → `PROCESSING` | `REFUNDED`
- `PROCESSING` → `PACKED` | `CANCELLED`
- `PACKED` → `SHIPPED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `REFUNDED` (partial refund case)

### OrderItem
```
OrderItem
├── id: UUID (PK)
├── order: Order (many-to-one)
├── productId: UUID (snapshot reference)
├── productName: String (snapshot)
├── sku: String (snapshot)
├── quantity: int
├── unitPrice: BigDecimal (snapshot)
└── lineTotal: BigDecimal
```
> Price and product details are **snapshotted** at order time — they must not change if the product is later updated.

### StockReservation
```
StockReservation
├── id: UUID (PK)
├── stockItem: StockItem (many-to-one)
├── orderId: UUID
├── quantityReserved: int
├── status: ReservationStatus [ACTIVE, RELEASED, FULFILLED]
└── createdAt: Instant
```

### Review
```
Review
├── id: UUID (PK)
├── product: Product (many-to-one)
├── customer: User (many-to-one)
├── rating: int (1–5)
├── title: String
├── body: String
├── status: ReviewStatus [PENDING, APPROVED, REJECTED]
└── createdAt: Instant
```

### Promotion
```
Promotion
├── id: UUID (PK)
├── name: String
├── type: PromotionType [COUPON, FLASH_SALE, BOGO, PERCENTAGE, FIXED_AMOUNT]
├── discountValue: BigDecimal
├── minimumOrderAmount: BigDecimal (nullable)
├── maxUsageCount: int
├── usageCount: int
├── startDate: Instant
├── endDate: Instant
└── status: PromotionStatus [ACTIVE, INACTIVE, EXPIRED]
```

---

## Business Invariants (Enforced in Domain/Service Layer)

| Rule | Enforcement Point |
|------|-----------------|
| `quantityAvailable >= 0` always | `StockItem.reserve()` method |
| `quantityReserved <= quantityOnHand` | `StockItem.reserve()` method |
| Order can only placed if stock available | `OrderService.placeOrder()` |
| Order total = sum(lineTotal) + shipping + tax - discount | `OrderService` (not DB computed) |
| Duplicate cart item → quantity update, not new row | `CartService.addItem()` |
| A product must have at least one category | `ProductService.create()` validation |
| Inactive product cannot be added to cart | `CartService.addItem()` |
| Delivered orders are immutable | `OrderService` status transition guard |
| Email must be globally unique | DB unique constraint + service pre-check |
| Coupon can only be applied once per order | `OrderService` + `PromotionService` |
