# CommerceHub

A production-ready, enterprise-grade B2B/B2C e-commerce backend built with Java 21 + Spring Boot 3.

---

## What is CommerceHub?

CommerceHub is a centralized e-commerce platform that enables businesses to create online stores, manage products, process customer orders, and track inventory. It serves three primary audiences: **Customers**, **Store Administrators**, and **Warehouse Staff**.

---

## Architecture

**Modular Monolith** (Phase 1) — designed for clean extraction into microservices in Phase 2.

Each module is a self-contained Maven sub-module with its own entities, repositories, services, DTOs, mappers, and controllers. Modules communicate only via service interfaces — never by cross-importing repositories or entities.

```
commercehub/
├── commercehub-app/           ← Spring Boot bootstrap
├── commercehub-common/        ← Shared: security, exceptions, response wrappers
├── commercehub-identity/      ← Auth, users, roles, addresses
├── commercehub-catalog/       ← Products, categories, brands
├── commercehub-inventory/     ← Warehouses, stock, reservations, adjustments
├── commercehub-cart/          ← Shopping cart
├── commercehub-order/         ← Order lifecycle management
├── commercehub-payment/       ← Payment (stub → Stripe/PayPal in phase 2)
├── commercehub-shipping/      ← Shipments, tracking
├── commercehub-notifications/ ← Email/SMS/push via domain events
├── commercehub-reviews/       ← Product ratings and reviews
├── commercehub-promotions/    ← Coupons, discounts, flash sales
├── commercehub-analytics/     ← Revenue, sales, inventory reports
└── commercehub-wishlist/      ← Customer saved products
```

---

## Technology Stack

| Concern | Choice |
|---------|--------|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT (JJWT) |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL 18 |
| Migrations | Flyway |
| Caching | Redis (Spring Cache) |
| Mapping | MapStruct |
| Validation | Jakarta Bean Validation 3 |
| API Docs | SpringDoc OpenAPI 3 (Swagger UI) |
| Testing | JUnit 5 + Mockito + Testcontainers |
| Build | Maven (multi-module) |
| Containerization | Docker + Docker Compose |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/01-architecture.md) | Architectural decisions, tech stack, request lifecycle, module communication rules |
| [Project Structure](docs/02-project-structure.md) | Full directory layout, package conventions, layer responsibilities |
| [Domain Model](docs/03-domain-model.md) | Entity relationships, core entity schemas, business invariants |
| [Database Design](docs/04-database-design.md) | Full SQL schema, migration strategy, indexing strategy |
| [API Standards & Security](docs/05-api-standards.md) | REST conventions, all endpoints, auth model, role matrix, HTTP codes |

---

## Implementation Tasks

| Task | Module | Priority | Status |
|------|--------|----------|--------|
| [TASK-001](docs/tasks/TASK-001-project-bootstrap.md) | Project Bootstrap & Common Infrastructure | Critical | Pending |
| [TASK-002](docs/tasks/TASK-002-identity-module.md) | Identity Module (Auth + Users) | Critical | Pending |
| [TASK-003](docs/tasks/TASK-003-catalog-module.md) | Product Catalog Module | High | Pending |
| [TASK-004](docs/tasks/TASK-004-inventory-module.md) | Inventory Module | High | Pending |
| [TASK-005](docs/tasks/TASK-005-cart-module.md) | Shopping Cart Module | High | Pending |
| [TASK-006](docs/tasks/TASK-006-order-module.md) | Order Management Module | High | Pending |
| [TASK-007](docs/tasks/TASK-007-remaining-modules.md) | Reviews, Wishlist, Promotions, Notifications, Analytics, Payment, Shipping | Medium | Pending |
| [TASK-008](docs/tasks/TASK-008-nonfunctional-requirements.md) | Non-Functional Requirements & Quality Gates | Ongoing | Pending |

---

## Getting Started (once implemented)

```bash
# Start infrastructure
docker-compose -f docker/docker-compose.yml up -d

# Run the application
./mvnw spring-boot:run -pl commercehub-app

# Access Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

## Key Design Rules

- **No business logic in controllers** — controllers only receive, validate, delegate, respond.
- **No entities returned from APIs** — always map to DTOs via MapStruct.
- **No field injection** — constructor injection only.
- **No cross-module repository access** — modules communicate via service interfaces.
- **No unbounded queries** — all list endpoints are paginated.
- **No hardcoded secrets** — all config via environment variables.
- **All stock changes are transactional and audited** — optimistic locking prevents oversell.
- **All order operations are idempotent** — `Idempotency-Key` header enforced on order placement.

---

## User Roles

| Role | Can Do |
|------|--------|
| `CUSTOMER` | Browse, cart, order, review, wishlist |
| `ADMIN` | Full product/inventory/order/user management |
| `WAREHOUSE` | Stock adjustments, order fulfillment |
| `SUPPORT` | View orders, process cancellations |
| `SYSTEM_ADMIN` | Everything + system configuration |
