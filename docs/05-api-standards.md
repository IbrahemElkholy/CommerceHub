# API Standards & Security — CommerceHub

## REST API Conventions

### URL Design

```
/api/v1/{module}/{resource}
```

| Pattern | Example |
|---------|---------|
| Collection | `GET /api/v1/catalog/products` |
| Single resource | `GET /api/v1/catalog/products/{id}` |
| Sub-resource | `GET /api/v1/orders/{id}/items` |
| Action (verb only when no noun fits) | `POST /api/v1/orders/{id}/cancel` |

### HTTP Method Usage

| Method | Use | Body | Success Code |
|--------|-----|------|--------------|
| GET | Read | None | 200 |
| POST | Create | Required | 201 |
| PUT | Full replace | Required | 200 |
| PATCH | Partial update | Required | 200 |
| DELETE | Delete (soft) | None | 204 |

### Standard Response Envelopes

**Success (single resource):**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Success (paginated list):**
```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "last": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "status": 404,
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with id 'abc-123' was not found.",
    "path": "/api/v1/catalog/products/abc-123",
    "traceId": "3f2b1a09-...",
    "timestamp": "2024-01-15T10:30:00Z",
    "fieldErrors": []
  }
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "error": {
    "status": 422,
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed.",
    "fieldErrors": [
      { "field": "price", "message": "must be greater than 0" },
      { "field": "sku",   "message": "must not be blank" }
    ]
  }
}
```

---

## API Endpoints Catalog

### Identity Module — `/api/v1/auth` & `/api/v1/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new customer |
| POST | `/api/v1/auth/login` | Public | Login, return JWT pair |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| POST | `/api/v1/auth/logout` | Authenticated | Revoke refresh token |
| POST | `/api/v1/auth/password/reset-request` | Public | Send reset email |
| POST | `/api/v1/auth/password/reset` | Public | Reset with token |
| GET | `/api/v1/users/me` | CUSTOMER+ | Get own profile |
| PATCH | `/api/v1/users/me` | CUSTOMER+ | Update own profile |
| GET | `/api/v1/users/{id}` | ADMIN | Get any user |
| GET | `/api/v1/users` | ADMIN | List all users (paged) |
| PATCH | `/api/v1/users/{id}/status` | ADMIN | Suspend/activate user |
| GET | `/api/v1/users/me/addresses` | CUSTOMER | List own addresses |
| POST | `/api/v1/users/me/addresses` | CUSTOMER | Add address |
| PUT | `/api/v1/users/me/addresses/{id}` | CUSTOMER | Update address |
| DELETE | `/api/v1/users/me/addresses/{id}` | CUSTOMER | Remove address |

### Catalog Module — `/api/v1/catalog`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/catalog/products` | Public | List/search products (paged, filtered) |
| GET | `/api/v1/catalog/products/{id}` | Public | Get product detail |
| POST | `/api/v1/catalog/products` | ADMIN | Create product |
| PUT | `/api/v1/catalog/products/{id}` | ADMIN | Update product |
| PATCH | `/api/v1/catalog/products/{id}/status` | ADMIN | Activate/deactivate |
| DELETE | `/api/v1/catalog/products/{id}` | ADMIN | Soft delete product |
| GET | `/api/v1/catalog/categories` | Public | List categories (tree) |
| POST | `/api/v1/catalog/categories` | ADMIN | Create category |
| PUT | `/api/v1/catalog/categories/{id}` | ADMIN | Update category |
| GET | `/api/v1/catalog/brands` | Public | List brands |
| POST | `/api/v1/catalog/brands` | ADMIN | Create brand |

**Product list query params:** `?page=0&size=20&sort=price,asc&category=electronics&brand=apple&minPrice=100&maxPrice=500&status=ACTIVE&search=iphone`

### Inventory Module — `/api/v1/inventory`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/inventory/warehouses` | ADMIN, WAREHOUSE | List warehouses |
| POST | `/api/v1/inventory/warehouses` | ADMIN | Create warehouse |
| GET | `/api/v1/inventory/stock` | ADMIN, WAREHOUSE | List stock (paged) |
| GET | `/api/v1/inventory/stock/{productId}` | ADMIN, WAREHOUSE | Stock by product |
| POST | `/api/v1/inventory/stock/adjust` | WAREHOUSE | Adjust stock quantity |
| GET | `/api/v1/inventory/stock/low` | ADMIN, WAREHOUSE | Low stock alerts |
| GET | `/api/v1/inventory/adjustments` | ADMIN | Audit log of adjustments |

### Cart Module — `/api/v1/cart`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/cart` | CUSTOMER | Get own cart |
| POST | `/api/v1/cart/items` | CUSTOMER | Add item (or update qty if exists) |
| PATCH | `/api/v1/cart/items/{productId}` | CUSTOMER | Update item quantity |
| DELETE | `/api/v1/cart/items/{productId}` | CUSTOMER | Remove item |
| DELETE | `/api/v1/cart` | CUSTOMER | Clear entire cart |
| POST | `/api/v1/cart/coupon` | CUSTOMER | Apply coupon code |
| DELETE | `/api/v1/cart/coupon` | CUSTOMER | Remove coupon |

### Order Module — `/api/v1/orders`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/orders` | CUSTOMER | Place order from cart |
| GET | `/api/v1/orders` | CUSTOMER | List own orders (paged) |
| GET | `/api/v1/orders/{id}` | CUSTOMER, ADMIN, SUPPORT | Get order detail |
| POST | `/api/v1/orders/{id}/cancel` | CUSTOMER, SUPPORT | Cancel order |
| GET | `/api/v1/orders/admin` | ADMIN | List all orders (paged, filtered) |
| PATCH | `/api/v1/orders/{id}/status` | ADMIN, WAREHOUSE | Advance order status |
| GET | `/api/v1/orders/{id}/history` | ADMIN, SUPPORT | Status history |

**Headers:** `Idempotency-Key: <uuid>` required for `POST /api/v1/orders`

### Reviews Module — `/api/v1/reviews`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/catalog/products/{id}/reviews` | Public | List approved reviews |
| POST | `/api/v1/catalog/products/{id}/reviews` | CUSTOMER | Submit review |
| PATCH | `/api/v1/reviews/{id}/status` | ADMIN | Approve/reject review |
| DELETE | `/api/v1/reviews/{id}` | ADMIN | Delete review |

### Wishlist Module — `/api/v1/wishlist`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/wishlist` | CUSTOMER | Get own wishlist |
| POST | `/api/v1/wishlist/{productId}` | CUSTOMER | Add product |
| DELETE | `/api/v1/wishlist/{productId}` | CUSTOMER | Remove product |

### Promotions Module — `/api/v1/promotions`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/promotions` | ADMIN | List all promotions |
| POST | `/api/v1/promotions` | ADMIN | Create promotion |
| PATCH | `/api/v1/promotions/{id}/status` | ADMIN | Activate/deactivate |
| POST | `/api/v1/promotions/{id}/coupons` | ADMIN | Generate coupon codes |
| POST | `/api/v1/promotions/validate` | CUSTOMER | Validate coupon code |

### Analytics Module — `/api/v1/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/analytics/revenue` | ADMIN | Revenue by date range |
| GET | `/api/v1/analytics/products/top-selling` | ADMIN | Top selling products |
| GET | `/api/v1/analytics/orders/summary` | ADMIN | Order count by status |
| GET | `/api/v1/analytics/customers/new` | ADMIN | New customers over time |
| GET | `/api/v1/analytics/inventory/turnover` | ADMIN | Inventory turnover |

---

## Security Model

### JWT Token Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access Token | 15 minutes | Memory / Authorization header |
| Refresh Token | 7 days | HTTP-only cookie or secure client store |

- Access token claims: `sub` (userId), `roles`, `iat`, `exp`
- Refresh tokens are hashed (SHA-256) before DB storage — raw token never stored.
- Logout revokes the refresh token in DB.

### Role-Based Access Matrix

| Endpoint Group | CUSTOMER | ADMIN | WAREHOUSE | SUPPORT | SYSTEM_ADMIN |
|---------------|----------|-------|-----------|---------|--------------|
| Own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| All users | — | ✓ | — | ✓ (read) | ✓ |
| Products (read) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Products (write) | — | ✓ | — | — | ✓ |
| Inventory | — | ✓ | ✓ | — | ✓ |
| Own cart | ✓ | — | — | — | — |
| Own orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| All orders | — | ✓ | ✓ | ✓ | ✓ |
| Order cancel | ✓ (own) | ✓ | — | ✓ | ✓ |
| Order status | — | ✓ | ✓ | — | ✓ |
| Reviews (submit) | ✓ | — | — | — | — |
| Reviews (moderate) | — | ✓ | — | — | ✓ |
| Promotions | — | ✓ | — | — | ✓ |
| Analytics | — | ✓ | — | — | ✓ |

### Security Headers (all responses)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cache-Control: no-store (for auth endpoints)
```

---

## HTTP Status Code Reference

| Code | When |
|------|------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Malformed request syntax |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate SKU) |
| 410 | Gone (product deleted) |
| 422 | Validation failed (well-formed but invalid) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
| 503 | Service temporarily unavailable |
