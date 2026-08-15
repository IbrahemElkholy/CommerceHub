# Architecture Diagrams — CommerceHub

All diagrams are written in [Mermaid](https://mermaid.js.org/), which renders natively on GitHub, GitLab, and most modern documentation tools.

---

## 1. System Context

Who uses CommerceHub and how they interact with it at the highest level.

```mermaid
C4Context
    title System Context — CommerceHub

    Person(customer, "Customer", "Browses products, manages cart, places orders, writes reviews")
    Person(admin, "Admin", "Manages products, inventory, orders, users, promotions, analytics")
    Person(warehouse, "Warehouse Staff", "Adjusts stock levels, fulfills and advances order status")
    Person(support, "Support Staff", "Views and cancels orders on behalf of customers")

    System(commercehub, "CommerceHub", "B2B/B2C e-commerce platform — modular monolith backend + React frontend")

    System_Ext(smtp, "Email Provider", "Resend / Gmail SMTP — transactional email delivery")
    System_Ext(payment, "Payment Gateway", "Stripe / PayPal (Phase 2)")
    System_Ext(cdn, "Object Storage / CDN", "Product image hosting — S3 / Cloudflare R2 (Phase 2)")

    Rel(customer, commercehub, "Uses", "HTTPS / REST")
    Rel(admin, commercehub, "Manages via", "HTTPS / REST")
    Rel(warehouse, commercehub, "Operates via", "HTTPS / REST")
    Rel(support, commercehub, "Operates via", "HTTPS / REST")

    Rel(commercehub, smtp, "Sends emails via", "SMTP / TLS")
    Rel(commercehub, payment, "Processes payments via", "HTTPS")
    Rel(commercehub, cdn, "Stores and serves images via", "HTTPS")
```

---

## 2. Container Diagram

The runtime components of CommerceHub and their relationships.

```mermaid
C4Container
    title Container Diagram — CommerceHub

    Person(user, "User (any role)")

    Container(frontend, "React Frontend", "React 18 + Vite + TailwindCSS", "Single-page application deployed on Vercel")
    Container(backend, "Spring Boot API", "Java 21 + Spring Boot 3.3", "Modular monolith — all 13 domain modules in one deployable JAR")
    ContainerDb(postgres, "PostgreSQL 18", "Relational Database", "Primary data store — module-scoped schemas via Flyway")
    ContainerDb(redis, "Redis 7", "In-Memory Cache", "Session cache, cart caching, rate limiting")
    Container(mailhog, "Mailhog", "SMTP Capture (dev only)", "Local email testing — replaced by Resend/Gmail in production")

    System_Ext(smtp_prod, "Resend / Gmail", "Production email delivery")
    System_Ext(koyeb, "Koyeb", "Backend hosting — free-tier, no cold start")
    System_Ext(vercel, "Vercel", "Frontend hosting — CDN-backed static deployment")

    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, backend, "API calls", "HTTPS / JSON REST")
    Rel(backend, postgres, "Reads / writes", "JDBC / JPA")
    Rel(backend, redis, "Caches / reads", "Lettuce / Spring Cache")
    Rel(backend, mailhog, "Sends email (dev)", "SMTP")
    Rel(backend, smtp_prod, "Sends email (prod)", "SMTP / TLS")
    Rel(koyeb, backend, "Hosts")
    Rel(vercel, frontend, "Hosts")
```

---

## 3. Module Architecture

How the 13 bounded-context modules are organized inside the Spring Boot application.

```mermaid
graph TD
    subgraph app["commercehub-app (Bootstrap)"]
        BOOT[CommerceHubApplication]
    end

    subgraph common["commercehub-common (Shared Infrastructure)"]
        SEC[JwtAuthFilter\nJwtService]
        EX[GlobalExceptionHandler\nBusinessException]
        RESP[ApiResponse\nPagedResponse]
        AUDIT[AuditableEntity]
        LOG[RequestLoggingFilter]
    end

    subgraph identity["commercehub-identity"]
        AUTH[AuthController\nAuthService]
        USR[UserController\nUserService]
    end

    subgraph catalog["commercehub-catalog"]
        PROD[ProductController\nProductService]
        CAT[CategoryController\nCategoryService]
        BRAND[BrandController]
    end

    subgraph inventory["commercehub-inventory"]
        STOCK[StockController\nInventoryService]
        WH[WarehouseController]
    end

    subgraph cart["commercehub-cart"]
        CART[CartController\nCartService]
    end

    subgraph order["commercehub-order"]
        ORD[OrderController\nOrderService]
    end

    subgraph payment["commercehub-payment"]
        PAY[PaymentService stub]
    end

    subgraph shipping["commercehub-shipping"]
        SHIP[ShipmentService]
    end

    subgraph notifications["commercehub-notifications"]
        NOTIF[NotificationService\nEmail/SMS/Push]
    end

    subgraph reviews["commercehub-reviews"]
        REV[ReviewController\nReviewService]
    end

    subgraph promotions["commercehub-promotions"]
        PROMO[PromotionController\nPromotionService]
    end

    subgraph analytics["commercehub-analytics"]
        ANA[AnalyticsController\nAnalyticsService]
    end

    subgraph wishlist["commercehub-wishlist"]
        WISH[WishlistController\nWishlistService]
    end

    BOOT --> common
    BOOT --> identity
    BOOT --> catalog
    BOOT --> inventory
    BOOT --> cart
    BOOT --> order
    BOOT --> payment
    BOOT --> shipping
    BOOT --> notifications
    BOOT --> reviews
    BOOT --> promotions
    BOOT --> analytics
    BOOT --> wishlist

    order -->|InventoryService interface| inventory
    order -->|PaymentService interface| payment
    order -->|ApplicationEvent| notifications
    order -->|ApplicationEvent| analytics
    cart -->|ProductService interface| catalog
    cart -->|PromotionService interface| promotions
    reviews -->|ProductService interface| catalog
```

---

## 4. Request Lifecycle (Sequence)

A typical authenticated API call from the HTTP request to the response.

```mermaid
sequenceDiagram
    participant C as Client
    participant F as JwtAuthFilter
    participant L as RequestLoggingFilter
    participant Ctrl as Controller
    participant Svc as Service
    participant Repo as Repository
    participant M as MapStruct Mapper
    participant EH as GlobalExceptionHandler

    C->>F: HTTP Request + Authorization: Bearer <token>
    F->>F: Validate JWT signature & expiry
    F->>F: Set SecurityContext (userId, roles)
    F->>L: Forward
    L->>L: Set MDC (traceId, userId, module)
    L->>Ctrl: Forward

    Ctrl->>Ctrl: @Valid — validate DTO
    alt Validation fails
        Ctrl-->>EH: MethodArgumentNotValidException
        EH-->>C: 422 ApiErrorResponse (fieldErrors)
    end

    Ctrl->>Svc: call service method
    Svc->>Repo: JPA query (paginated)
    Repo-->>Svc: Entity / Page<Entity>
    Svc->>M: map(entity)
    M-->>Svc: ResponseDTO
    Svc-->>Ctrl: ResponseDTO

    Ctrl-->>C: 200 ApiResponse { success: true, data: ... }

    Note over Svc,EH: On BusinessException
    Svc-->>EH: throw ResourceNotFoundException / ConflictException
    EH-->>C: 404 / 409 ApiErrorResponse { traceId, code, message }
```

---

## 5. Order Placement Flow

End-to-end flow for placing an order, showing cross-module coordination.

```mermaid
sequenceDiagram
    participant C as Customer
    participant OC as OrderController
    participant OS as OrderService
    participant CS as CartService
    participant IS as InventoryService
    participant PS as PaymentService
    participant DB as PostgreSQL
    participant EV as Spring ApplicationEvent
    participant NS as NotificationService

    C->>OC: POST /api/v1/orders\nIdempotency-Key: <uuid>
    OC->>OS: placeOrder(customerId, idempotencyKey)

    OS->>DB: Check idempotency key (UNIQUE constraint)
    alt Duplicate key
        OS-->>OC: Return existing order (idempotent)
    end

    OS->>CS: getActiveCart(customerId)
    CS-->>OS: Cart { items, couponCode, discountAmount }

    OS->>IS: reserveStock(items)
    IS->>DB: SELECT FOR UPDATE (optimistic locking @Version)
    alt Insufficient stock
        IS-->>OS: throw InsufficientStockException
        OS-->>OC: 422 INSUFFICIENT_STOCK
    end
    IS->>DB: INSERT stock_reservations
    IS-->>OS: Reservations confirmed

    OS->>DB: INSERT orders + order_items\n(price & product name snapshotted)
    OS->>DB: INSERT order_status_history (CREATED)

    OS->>PS: initiatePayment(orderId, amount)
    PS-->>OS: PENDING_PAYMENT

    OS->>CS: markCartCheckedOut(cartId)

    OS->>EV: publish OrderPlacedEvent

    EV->>NS: onOrderPlaced → send confirmation email
    NS-->>C: Order confirmation email

    OS-->>OC: OrderResponse { orderNumber, status, totalAmount }
    OC-->>C: 201 ApiResponse { data: OrderResponse }
```

---

## 6. Order Status Machine

All valid order status transitions.

```mermaid
stateDiagram-v2
    [*] --> CREATED : POST /orders (customer)

    CREATED --> PENDING_PAYMENT : Payment initiated
    CREATED --> CANCELLED : Customer / Support cancels

    PENDING_PAYMENT --> PAID : Payment confirmed
    PENDING_PAYMENT --> CANCELLED : Payment timeout / failure

    PAID --> PROCESSING : Admin starts processing
    PAID --> REFUNDED : Admin initiates refund

    PROCESSING --> PACKED : Warehouse packs order
    PROCESSING --> CANCELLED : Admin cancels

    PACKED --> SHIPPED : Warehouse ships order

    SHIPPED --> DELIVERED : Delivery confirmed

    DELIVERED --> REFUNDED : Partial / full refund

    CANCELLED --> [*]
    REFUNDED --> [*]
    DELIVERED --> [*]
```

---

## 7. Database Entity Relationship Diagram

Core entity relationships across all modules.

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR status
        TIMESTAMPTZ deleted_at
        TIMESTAMPTZ created_at
    }
    roles {
        BIGINT id PK
        VARCHAR name UK
    }
    user_roles {
        UUID user_id FK
        BIGINT role_id FK
    }
    addresses {
        UUID id PK
        UUID user_id FK
        VARCHAR label
        VARCHAR street_line1
        VARCHAR city
        CHAR country_code
        BOOLEAN is_default
    }
    categories {
        BIGINT id PK
        VARCHAR name UK
        VARCHAR slug UK
        BIGINT parent_id FK
    }
    brands {
        BIGINT id PK
        VARCHAR name UK
        VARCHAR slug UK
        VARCHAR logo_url
    }
    products {
        UUID id PK
        VARCHAR sku UK
        VARCHAR name
        NUMERIC price
        VARCHAR status
        BIGINT brand_id FK
        TIMESTAMPTZ deleted_at
    }
    product_categories {
        UUID product_id FK
        BIGINT category_id FK
    }
    product_images {
        UUID id PK
        UUID product_id FK
        VARCHAR url
        BOOLEAN is_primary
        INT sort_order
    }
    warehouses {
        UUID id PK
        VARCHAR name
        VARCHAR code UK
        BOOLEAN active
    }
    stock_items {
        UUID id PK
        UUID product_id FK
        UUID warehouse_id FK
        INT quantity_on_hand
        INT quantity_reserved
        INT low_stock_threshold
        BIGINT version
    }
    stock_reservations {
        UUID id PK
        UUID stock_item_id FK
        UUID order_id
        INT quantity_reserved
        VARCHAR status
    }
    stock_adjustments {
        UUID id PK
        UUID stock_item_id FK
        UUID adjusted_by FK
        INT quantity_delta
        VARCHAR reason
    }
    carts {
        UUID id PK
        UUID user_id FK
        VARCHAR status
        VARCHAR coupon_code
        NUMERIC discount_amount
    }
    cart_items {
        UUID id PK
        UUID cart_id FK
        UUID product_id FK
        INT quantity
        NUMERIC unit_price
    }
    orders {
        UUID id PK
        VARCHAR order_number UK
        UUID customer_id FK
        VARCHAR status
        NUMERIC subtotal
        NUMERIC discount_amount
        NUMERIC shipping_cost
        NUMERIC tax_amount
        NUMERIC total_amount
        VARCHAR applied_coupon
        VARCHAR idempotency_key UK
    }
    order_items {
        UUID id PK
        UUID order_id FK
        UUID product_id
        VARCHAR product_name
        VARCHAR sku
        INT quantity
        NUMERIC unit_price
        NUMERIC line_total
    }
    order_status_history {
        UUID id PK
        UUID order_id FK
        VARCHAR from_status
        VARCHAR to_status
        UUID changed_by FK
        TIMESTAMPTZ changed_at
    }
    reviews {
        UUID id PK
        UUID product_id FK
        UUID customer_id FK
        SMALLINT rating
        VARCHAR title
        TEXT body
        VARCHAR status
    }
    wishlist_items {
        UUID id PK
        UUID user_id FK
        UUID product_id FK
    }
    promotions {
        UUID id PK
        VARCHAR name
        VARCHAR type
        NUMERIC discount_value
        INT max_usage_count
        INT usage_count
        TIMESTAMPTZ start_date
        TIMESTAMPTZ end_date
        VARCHAR status
    }
    coupons {
        UUID id PK
        UUID promotion_id FK
        VARCHAR code UK
        INT max_uses
        INT current_uses
    }

    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned via"
    users ||--o{ addresses : "has"
    users ||--o| carts : "owns"
    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"
    users ||--o{ wishlist_items : "saves"

    products ||--o{ product_categories : "belongs to"
    categories ||--o{ product_categories : "contains"
    categories ||--o{ categories : "parent of"
    brands ||--o{ products : "makes"
    products ||--o{ product_images : "has"

    products ||--o{ stock_items : "tracked in"
    warehouses ||--o{ stock_items : "stores"
    stock_items ||--o{ stock_reservations : "reserved by"
    stock_items ||--o{ stock_adjustments : "adjusted via"

    carts ||--o{ cart_items : "contains"
    products ||--o{ cart_items : "added to"

    orders ||--o{ order_items : "contains"
    orders ||--o{ order_status_history : "tracks"

    products ||--o{ reviews : "reviewed by"
    products ||--o{ wishlist_items : "saved in"

    promotions ||--o{ coupons : "generates"
```

---

## 8. Authentication Flow (JWT)

Login, token usage, and refresh flow.

```mermaid
sequenceDiagram
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant DB as PostgreSQL
    participant JS as JwtService
    participant F as JwtAuthFilter

    Note over C,F: Login
    C->>AC: POST /api/v1/auth/login\n{ email, password }
    AC->>AS: login(email, password)
    AS->>DB: SELECT user WHERE email = ?
    AS->>AS: BCrypt.verify(password, passwordHash)
    AS->>JS: generateAccessToken(userId, roles)
    AS->>JS: generateRefreshToken()
    AS->>DB: INSERT refresh_tokens (SHA-256 hash of token)
    AS-->>AC: AuthResponse { accessToken, refreshToken, expiresIn }
    AC-->>C: 200 { accessToken, refreshToken }

    Note over C,F: Authenticated Request
    C->>F: GET /api/v1/users/me\nAuthorization: Bearer <accessToken>
    F->>JS: validateToken(accessToken)
    JS-->>F: Claims { sub: userId, roles, exp }
    F->>F: Set SecurityContext
    F->>AC: Forward to controller

    Note over C,F: Token Refresh
    C->>AC: POST /api/v1/auth/refresh\n{ refreshToken }
    AC->>AS: refresh(refreshToken)
    AS->>DB: SELECT WHERE token_hash = SHA256(refreshToken)\nAND revoked = false AND expires_at > NOW()
    AS->>JS: generateAccessToken(userId, roles)
    AS-->>C: 200 { accessToken, expiresIn }

    Note over C,F: Logout
    C->>AC: POST /api/v1/auth/logout\n{ refreshToken }
    AC->>AS: logout(refreshToken)
    AS->>DB: UPDATE refresh_tokens SET revoked = true
    AS-->>C: 204 No Content
```

---

## 9. Inventory Reservation Flow

How stock is safely reserved during order placement using optimistic locking.

```mermaid
sequenceDiagram
    participant OS as OrderService
    participant IS as InventoryService
    participant DB as PostgreSQL

    OS->>IS: reserveStock([ {productId, qty}, ... ])

    loop For each order item
        IS->>DB: SELECT * FROM stock_items\nWHERE product_id = ? AND warehouse_id = ?\nFOR UPDATE (optimistic via @Version)

        alt quantityAvailable < requestedQty
            IS-->>OS: throw InsufficientStockException
        end

        IS->>DB: UPDATE stock_items\nSET quantity_reserved = quantity_reserved + qty,\n    version = version + 1\nWHERE id = ? AND version = <expected>

        alt OptimisticLockException (version mismatch — concurrent update)
            IS->>IS: Retry (up to 3 times)
            IS-->>OS: throw StockReservationConflictException (if retries exhausted)
        end

        IS->>DB: INSERT stock_reservations\n(stock_item_id, order_id, quantity_reserved, status=ACTIVE)
    end

    IS-->>OS: All reservations committed
```

---

## 10. Deployment Architecture

Production deployment topology using free-tier cloud services.

```mermaid
graph LR
    subgraph internet["Internet"]
        BROWSER[Browser / API Client]
    end

    subgraph vercel["Vercel (Frontend CDN)"]
        REACT[React SPA\ncommerceHub-coral.vercel.app]
    end

    subgraph koyeb["Koyeb (Backend — 512 MB, no cold start)"]
        API[Spring Boot JAR\n:8080]
    end

    subgraph neon["Neon (Serverless PostgreSQL)"]
        PG[(PostgreSQL 18\ncommerceHub DB)]
    end

    subgraph upstash["Upstash (Serverless Redis)"]
        REDIS[(Redis 7\nCache + Rate Limit)]
    end

    subgraph resend["Resend"]
        MAIL[SMTP Relay\n3000 emails/month free]
    end

    subgraph github["GitHub"]
        GH_ACTIONS[GitHub Actions CI\nBuild → Test → Deploy]
        REPO[Git Repository]
    end

    BROWSER -->|HTTPS| REACT
    BROWSER -->|HTTPS REST| API
    REACT -->|HTTPS REST /api/v1| API
    API -->|JDBC + SSL| PG
    API -->|TLS + password| REDIS
    API -->|SMTP TLS :587| MAIL
    REPO -->|push triggers| GH_ACTIONS
    GH_ACTIONS -->|auto-deploy on main| koyeb
    GH_ACTIONS -->|auto-deploy on main| vercel
```

---

> **Tip:** These diagrams render natively in GitHub's Markdown viewer.
> For local preview, use the [Mermaid Live Editor](https://mermaid.live) or the VS Code Mermaid Preview extension.
