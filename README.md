<div align="center">

# CommerceHub

**Enterprise-grade B2B/B2C e-commerce backend**

[![CI](https://github.com/IbrahemElkholy/CommerceHub/actions/workflows/ci.yml/badge.svg)](https://github.com/IbrahemElkholy/CommerceHub/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green?logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

[Live API (Swagger UI)](https://commercehub-api.koyeb.app/swagger-ui.html) · [Architecture Diagrams](docs/architecture-diagrams.md) · [API Reference](docs/05-api-standards.md) · [Deployment Guide](docs/deployment-free-tier.md)

</div>

---

## Overview

CommerceHub is a production-ready, modular-monolith e-commerce platform built with Java 21 and Spring Boot 3. It handles the full commerce lifecycle — authentication, product catalog, inventory, shopping cart, order management, payments, shipping, promotions, and analytics — across **13 bounded-context modules** in a single deployable artifact that is architected for clean extraction into microservices.

**Who is it for?**

| Audience | What they do |
|----------|-------------|
| Customers | Browse products, manage cart, place orders, write reviews, use wishlists |
| Admins | Manage products, inventory, orders, users, promotions, and view analytics |
| Warehouse Staff | Adjust stock, fulfill and advance order status |
| Support Staff | View and cancel orders on behalf of customers |

---

## Architecture

### Modular Monolith → Microservices

```
                        ┌──────────────────────────────────────────────────┐
                        │                  CommerceHub                     │
                        │                                                  │
  ┌──────────┐          │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
  │  React   │  HTTPS   │  │ Identity │  │ Catalog  │  │  Inventory    │  │
  │ Frontend │ ───────► │  │  Module  │  │  Module  │  │    Module     │  │
  └──────────┘          │  └──────────┘  └──────────┘  └───────────────┘  │
                        │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
                        │  │   Cart   │  │  Order   │  │    Payment    │  │
                        │  │  Module  │  │  Module  │  │    Module     │  │
                        │  └──────────┘  └──────────┘  └───────────────┘  │
                        │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
                        │  │Shipping  │  │Promotions│  │ Notifications │  │
                        │  │  Module  │  │  Module  │  │    Module     │  │
                        │  └──────────┘  └──────────┘  └───────────────┘  │
                        │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
                        │  │ Reviews  │  │Wishlist  │  │  Analytics    │  │
                        │  │  Module  │  │  Module  │  │    Module     │  │
                        │  └──────────┘  └──────────┘  └───────────────┘  │
                        └──────────────────────────────────────────────────┘
                                │                   │
                        ┌───────┴──────┐    ┌───────┴──────┐
                        │  PostgreSQL  │    │    Redis     │
                        └──────────────┘    └──────────────┘
```

### Request Lifecycle

```
HTTP Request
    │
    ▼
[JwtAuthFilter]            → Validates JWT, populates SecurityContext
    │
    ▼
[RequestLoggingFilter]     → Sets MDC: traceId, userId, module
    │
    ▼
[Controller]               → Validates DTO (@Valid), delegates to service
    │
    ▼
[Service]                  → Business logic, throws BusinessExceptions
    │
    ▼
[Repository]               → JPA queries (paginated), returns entities
    │
    ▼
[MapStruct Mapper]         → Entity → Response DTO
    │
    ▼
HTTP Response (ApiResponse wrapper)
    │
    (on exception)
    ▼
[GlobalExceptionHandler]   → Maps to ApiErrorResponse with traceId
```

### Module Communication Rules

- **No cross-repository calls** — Module A never imports Module B's repository
- **Service interfaces only** — inter-module calls go through published service interfaces
- **No entity leaking** — modules exchange data via DTOs or `ApplicationEvent`
- **Events for side effects** — notifications and analytics are triggered via Spring events (→ Kafka in Phase 2)

### Phase 2 Extraction Path

Each module is already pre-wired for microservice extraction:
1. `ApplicationEvent` → Kafka topic
2. Service interface → Feign client
3. Module gets its own database (Flyway versioning is already module-scoped)
4. **Zero business logic changes required**

> See [Architecture ADR](docs/01-architecture.md) and [Architecture Diagrams](docs/architecture-diagrams.md) for detailed Mermaid diagrams.

---

## Technology Stack

| Concern | Technology | Reason |
|---------|-----------|--------|
| Language | Java 21 | LTS, virtual threads, modern features |
| Framework | Spring Boot 3.3 | Production-grade, rich ecosystem |
| Security | Spring Security + JJWT | Stateless JWT, role-based access |
| Persistence | Spring Data JPA + Hibernate | Full ORM with query control |
| Database | PostgreSQL 18 | ACID, JSON support, performance |
| Schema Migrations | Flyway | Version-controlled, module-scoped |
| Caching | Redis (Spring Cache) | Cart cache, rate limiting |
| Async / Events | Spring Events → Kafka (Phase 2) | Decoupled notifications & analytics |
| DTO Mapping | MapStruct | Compile-time, zero-reflection |
| Validation | Jakarta Bean Validation 3 | Declarative, standardized |
| API Documentation | SpringDoc OpenAPI 3 (Swagger UI) | Auto-generated, always in sync |
| Testing | JUnit 5 + Mockito + Testcontainers | Unit + real-DB integration tests |
| Build | Maven (multi-module) | Dependency management, reproducible builds |
| Containerization | Docker + Docker Compose | Reproducible dev and prod environments |
| Logging | SLF4J + Logback (JSON) | ELK-compatible structured logs |
| Code Quality | Checkstyle, SpotBugs, JaCoCo | Enforced standards, coverage gates |
| CI/CD | GitHub Actions | Build, test, deploy on every push |

---

## Features

### Authentication & Identity
- JWT access token (15 min) + refresh token (7 days, hashed in DB)
- Password reset via email with single-use token
- BCrypt password hashing (strength 12)
- Role-based access: `CUSTOMER`, `ADMIN`, `WAREHOUSE`, `SUPPORT`, `SYSTEM_ADMIN`

### Product Catalog
- Hierarchical categories (self-referential tree)
- Products with brand, multi-category assignment, multiple images
- Rich filtering: category, brand, price range, status, full-text search
- Soft delete — no data is permanently lost

### Inventory Management
- Multi-warehouse stock tracking per product
- **Optimistic locking** (`@Version`) on `StockItem` to prevent concurrent oversell
- Stock reservations tied to order lifecycle
- Full adjustment audit log with reason codes
- Low-stock alerts

### Shopping Cart
- One active cart per customer
- Duplicate item → quantity update (not a new row)
- Price snapshotted at time of adding to cart
- Coupon code application with validation

### Order Management
- **Idempotent order placement** via `Idempotency-Key` header
- Human-readable order numbers (`ORD-2024-000001`)
- Full status machine: `CREATED → PENDING_PAYMENT → PAID → PROCESSING → PACKED → SHIPPED → DELIVERED`
- Status transition history with actor and optional note
- Price, product name, and shipping address snapshotted at order time

### Additional Modules
- **Reviews** — 1–5 star ratings, moderation workflow (PENDING → APPROVED/REJECTED), one per product per customer
- **Wishlist** — save products for later, fast lookup
- **Promotions** — coupons, flash sales, percentage and fixed discounts with usage limits
- **Notifications** — email/SMS/push triggered by domain events
- **Analytics** — revenue by date range, top-selling products, order summaries, inventory turnover
- **Payment** — stub implementation in Phase 1 → Stripe/PayPal integration in Phase 2
- **Shipping** — shipment records and tracking

---

## Project Structure

```
commercehub/
├── commercehub-app/           ← Spring Boot bootstrap (no business logic)
├── commercehub-common/        ← Shared: security, exceptions, response wrappers, audit base
├── commercehub-identity/      ← Auth, users, roles, addresses
├── commercehub-catalog/       ← Products, categories, brands, images
├── commercehub-inventory/     ← Warehouses, stock items, reservations, adjustments
├── commercehub-cart/          ← Shopping cart + coupon application
├── commercehub-order/         ← Order lifecycle, status machine, history
├── commercehub-payment/       ← Payment (stub → Stripe/PayPal in Phase 2)
├── commercehub-shipping/      ← Shipments, tracking events
├── commercehub-notifications/ ← Email/SMS/push via domain events
├── commercehub-reviews/       ← Product ratings and reviews
├── commercehub-promotions/    ← Coupons, discounts, flash sales
├── commercehub-analytics/     ← Revenue, sales, inventory reports
├── commercehub-wishlist/      ← Customer saved products
├── docker/
│   ├── docker-compose.yml     ← Dev: PostgreSQL 18 + Redis 7 + Mailhog
│   └── docker-compose.prod.yml
├── docs/                      ← Architecture, domain model, DB design, API standards
└── .github/workflows/
    └── ci.yml                 ← Build, test, quality gates on every push
```

Package convention: `com.commercehub.<module>.<layer>`

> See [Project Structure](docs/02-project-structure.md) for the full directory layout.

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Java (JDK) | 21 |
| Maven | 3.9+ (or use `./mvnw`) |
| Docker Desktop | 24+ |

### 1. Clone the repository

```bash
git clone https://github.com/IbrahemElkholy/CommerceHub.git
cd CommerceHub
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env — see Environment Variables section below
```

### 3. Start infrastructure

```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts:
- **PostgreSQL 18** on `localhost:5432`
- **Redis 7** on `localhost:6379`
- **Mailhog** (local SMTP + web UI) on `localhost:1025` / `localhost:8025`

### 4. Run the application

```bash
./mvnw spring-boot:run -pl commercehub-app
```

Or build and run the JAR:

```bash
./mvnw clean package -DskipTests
java -jar commercehub-app/target/commercehub-app-*.jar
```

### 5. Verify

| URL | Description |
|-----|-------------|
| `http://localhost:8080/swagger-ui.html` | Interactive API documentation |
| `http://localhost:8080/actuator/health` | Health check |
| `http://localhost:8025` | Mailhog web UI (local email) |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/commercehub
DB_USERNAME=commercehub
DB_PASSWORD=commercehub

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (minimum 32-character secret)
JWT_SECRET=replace-this-with-a-secure-random-secret-at-least-32-chars
JWT_ACCESS_TOKEN_EXPIRY=900       # seconds — 15 minutes
JWT_REFRESH_TOKEN_EXPIRY=604800   # seconds — 7 days

# Mail (Mailhog for local dev)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=

# Spring Profile
SPRING_PROFILES_ACTIVE=dev
```

> **Security:** Never commit `.env` to version control. Generate a strong JWT secret with:
> ```bash
> openssl rand -hex 32
> ```

---

## Docker Setup

### Development (local)

```bash
# Start all infrastructure services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop
docker-compose -f docker/docker-compose.yml down
```

### Build the application image

```bash
docker build -t commercehub:latest .
```

### Infrastructure services included

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| PostgreSQL | `postgres:18-alpine` | 5432 | Primary database |
| Redis | `redis:7-alpine` | 6379 | Cache + rate limiting |
| Mailhog | `mailhog/mailhog` | 1025 / 8025 | SMTP capture (dev) |

---

## API Documentation

The API follows REST conventions with a consistent JSON envelope.

**Base URL:** `http://localhost:8080/api/v1`

**Interactive docs:** `http://localhost:8080/swagger-ui.html`

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { "..." },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Paginated list:**
```json
{
  "success": true,
  "data": {
    "content": [ "..." ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "last": false
  }
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
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Endpoint Summary

#### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Register new customer |
| `POST` | `/auth/login` | Public | Login, returns JWT pair |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/logout` | Required | Revoke refresh token |
| `POST` | `/auth/password/reset-request` | Public | Send password reset email |
| `POST` | `/auth/password/reset` | Public | Reset with token |

#### Users — `/api/v1/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/me` | CUSTOMER+ | Get own profile |
| `PATCH` | `/users/me` | CUSTOMER+ | Update own profile |
| `GET` | `/users/me/addresses` | CUSTOMER | List own addresses |
| `POST` | `/users/me/addresses` | CUSTOMER | Add address |
| `PUT` | `/users/me/addresses/{id}` | CUSTOMER | Update address |
| `DELETE` | `/users/me/addresses/{id}` | CUSTOMER | Remove address |
| `GET` | `/users` | ADMIN | List all users (paged) |
| `GET` | `/users/{id}` | ADMIN | Get any user |
| `PATCH` | `/users/{id}/status` | ADMIN | Suspend / activate user |

#### Catalog — `/api/v1/catalog`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/catalog/products` | Public | Search & filter products (paged) |
| `GET` | `/catalog/products/{id}` | Public | Get product detail |
| `POST` | `/catalog/products` | ADMIN | Create product |
| `PUT` | `/catalog/products/{id}` | ADMIN | Update product |
| `PATCH` | `/catalog/products/{id}/status` | ADMIN | Activate / deactivate |
| `DELETE` | `/catalog/products/{id}` | ADMIN | Soft delete |
| `GET` | `/catalog/categories` | Public | Category tree |
| `POST` | `/catalog/categories` | ADMIN | Create category |
| `GET` | `/catalog/brands` | Public | List brands |
| `POST` | `/catalog/brands` | ADMIN | Create brand |

Query params for `GET /catalog/products`: `page`, `size`, `sort`, `category`, `brand`, `minPrice`, `maxPrice`, `status`, `search`

#### Inventory — `/api/v1/inventory`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/inventory/warehouses` | ADMIN, WAREHOUSE | List warehouses |
| `POST` | `/inventory/warehouses` | ADMIN | Create warehouse |
| `GET` | `/inventory/stock` | ADMIN, WAREHOUSE | List stock (paged) |
| `GET` | `/inventory/stock/{productId}` | ADMIN, WAREHOUSE | Stock by product |
| `POST` | `/inventory/stock/adjust` | WAREHOUSE | Adjust stock quantity |
| `GET` | `/inventory/stock/low` | ADMIN, WAREHOUSE | Low-stock alerts |
| `GET` | `/inventory/adjustments` | ADMIN | Full adjustment audit log |

#### Cart — `/api/v1/cart`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/cart` | CUSTOMER | Get own cart |
| `POST` | `/cart/items` | CUSTOMER | Add item (merges if duplicate) |
| `PATCH` | `/cart/items/{productId}` | CUSTOMER | Update item quantity |
| `DELETE` | `/cart/items/{productId}` | CUSTOMER | Remove item |
| `DELETE` | `/cart` | CUSTOMER | Clear entire cart |
| `POST` | `/cart/coupon` | CUSTOMER | Apply coupon code |
| `DELETE` | `/cart/coupon` | CUSTOMER | Remove coupon |

#### Orders — `/api/v1/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/orders` | CUSTOMER | Place order from cart |
| `GET` | `/orders` | CUSTOMER | List own orders (paged) |
| `GET` | `/orders/{id}` | CUSTOMER, ADMIN, SUPPORT | Get order detail |
| `POST` | `/orders/{id}/cancel` | CUSTOMER, SUPPORT | Cancel order |
| `GET` | `/orders/admin` | ADMIN | List all orders (paged, filtered) |
| `PATCH` | `/orders/{id}/status` | ADMIN, WAREHOUSE | Advance order status |
| `GET` | `/orders/{id}/history` | ADMIN, SUPPORT | Status change history |

> `POST /orders` requires the `Idempotency-Key: <uuid>` header.

#### Reviews, Wishlist, Promotions, Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/catalog/products/{id}/reviews` | Public | List approved reviews |
| `POST` | `/catalog/products/{id}/reviews` | CUSTOMER | Submit review |
| `PATCH` | `/reviews/{id}/status` | ADMIN | Approve / reject review |
| `GET` | `/wishlist` | CUSTOMER | Get own wishlist |
| `POST` | `/wishlist/{productId}` | CUSTOMER | Add to wishlist |
| `DELETE` | `/wishlist/{productId}` | CUSTOMER | Remove from wishlist |
| `GET` | `/promotions` | ADMIN | List promotions |
| `POST` | `/promotions` | ADMIN | Create promotion |
| `POST` | `/promotions/validate` | CUSTOMER | Validate coupon code |
| `GET` | `/analytics/revenue` | ADMIN | Revenue by date range |
| `GET` | `/analytics/products/top-selling` | ADMIN | Top-selling products |
| `GET` | `/analytics/orders/summary` | ADMIN | Order counts by status |

> Full endpoint reference: [API Standards & Security](docs/05-api-standards.md)

---

## Security Model

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access Token | 15 minutes | Bearer token in `Authorization` header |
| Refresh Token | 7 days | SHA-256 hashed before DB storage |

**Role matrix (abbreviated):**

| Resource | CUSTOMER | ADMIN | WAREHOUSE | SUPPORT |
|----------|----------|-------|-----------|---------|
| Products (read) | ✓ | ✓ | ✓ | ✓ |
| Products (write) | — | ✓ | — | — |
| Inventory | — | ✓ | ✓ | — |
| Cart | ✓ | — | — | — |
| Own orders | ✓ | ✓ | ✓ | ✓ |
| All orders | — | ✓ | ✓ | ✓ |
| Analytics | — | ✓ | — | — |

---

## Database Schema

The database follows module-scoped Flyway migrations (V1.x → V12.x), ensuring each module owns its schema and can be extracted independently.

```
users ──────── user_roles ──── roles
  │
  ├── addresses
  ├── carts ──── cart_items ──── products
  ├── orders ─── order_items
  │     └──── order_status_history
  ├── reviews ──── products
  └── wishlist_items ──── products

products ── product_categories ── categories (self-referential tree)
products ── brands
products ── product_images

stock_items (product × warehouse + optimistic locking version)
  ├── stock_reservations
  └── stock_adjustments

promotions ── coupons
```

Key design decisions:
- `UUID` primary keys on all major entities (DB-generated)
- `deleted_at` soft-delete on users, products, and orders
- Price and product data **snapshotted** in `cart_items` and `order_items`
- Shipping address **denormalized** (embedded) in the `orders` table
- `version` column on `stock_items` for optimistic locking

> Full SQL schema: [Database Design](docs/04-database-design.md)

---

## CI/CD

Every push triggers the GitHub Actions pipeline:

1. **Compile** — `mvn compile`
2. **Unit Tests** — `mvn test` (with PostgreSQL 18 + Redis service containers)
3. **Integration Tests** — `mvn verify` (Testcontainers)
4. **Coverage Report** — JaCoCo report uploaded as build artifact

Merging to `main` triggers auto-deployment on Koyeb (backend) and Vercel (frontend).

> See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and the [Deployment Guide](docs/deployment-free-tier.md).

---

## Design Principles

| Rule | Details |
|------|---------|
| No business logic in controllers | Controllers receive, validate, delegate, respond — nothing else |
| No entity leaking | All API responses are DTOs mapped via MapStruct |
| Constructor injection only | No `@Autowired` field injection anywhere |
| No cross-module repository access | Modules communicate via service interfaces only |
| Paginated queries only | No unbounded list queries — default page 20, max 100 |
| Optimistic locking on stock | `@Version` on `StockItem` prevents concurrent oversell |
| Idempotent order placement | `Idempotency-Key` header enforced — safe to retry |
| No hardcoded secrets | All config via environment variables |
| Structured logging | JSON logs with `traceId`, `userId`, `module`, `durationMs` |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture ADR](docs/01-architecture.md) | Architectural decisions, tech stack, request lifecycle |
| [Project Structure](docs/02-project-structure.md) | Full directory layout, package conventions, layer rules |
| [Domain Model](docs/03-domain-model.md) | Entity relationships, schemas, business invariants |
| [Database Design](docs/04-database-design.md) | Full SQL schema, Flyway strategy, indexing |
| [API Standards & Security](docs/05-api-standards.md) | REST conventions, all endpoints, auth model, role matrix |
| [Architecture Diagrams](docs/architecture-diagrams.md) | Mermaid diagrams: system context, DB schema, API flow |
| [Deployment Guide](docs/deployment-free-tier.md) | Free-tier deployment: Koyeb + Neon + Upstash + Vercel |

---

## Future Improvements (Phase 2)

- **Microservice extraction** — each module becomes an independent service with its own DB
- **Kafka event bus** — replace Spring `ApplicationEvent` with durable Kafka topics
- **Stripe / PayPal integration** — replace payment stub with real providers
- **Elasticsearch** — full-text product search at scale
- **CDN + object storage** — product image hosting via S3/Cloudflare R2
- **Rate limiting** — Redis-backed per-user and per-IP throttling
- **Admin dashboard UI** — React-based backoffice for ADMIN and WAREHOUSE roles
- **GraphQL gateway** — optional query flexibility for frontend teams
- **Observability stack** — Prometheus + Grafana + ELK for production monitoring
