# Architecture Decision Record — CommerceHub

## Architectural Style

**Modular Monolith** (phase 1) → extractable into microservices (phase 2).

### Rationale
- Avoids distributed-systems complexity before product/team maturity.
- Package-by-feature structure keeps bounded contexts clean and ready for extraction.
- Single deployment artifact simplifies CI/CD at this stage.
- All inter-module communication happens through **service interfaces**, never direct repository cross-calls.

---

## Bounded Contexts (Modules)

Each module is a self-contained package with its own entities, repositories, services, DTOs, mappers, and controllers.
Modules communicate only via **Application Service interfaces** — never by importing each other's repositories or entities.

```
┌─────────────────────────────────────────────────────────────┐
│                        CommerceHub                          │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Identity │  │   Product    │  │      Inventory        │ │
│  │ Module   │  │   Catalog    │  │       Module          │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Cart    │  │    Order     │  │       Payment         │ │
│  │ Module   │  │    Module    │  │       Module          │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │Shipping  │  │  Promotions  │  │     Notifications     │ │
│  │ Module   │  │    Module    │  │       Module          │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────┐  ┌──────────────┐                            │
│  │ Reviews  │  │  Analytics   │                            │
│  │ Module   │  │   Module     │                            │
│  └──────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Concern                  | Choice                                      | Reason                                              |
|--------------------------|---------------------------------------------|-----------------------------------------------------|
| Language                 | Java 21                                     | LTS, virtual threads, modern language features      |
| Framework                | Spring Boot 3.x                             | Production-grade, ecosystem maturity                |
| Security                 | Spring Security + JWT (JJWT)                | Stateless auth, role-based access                   |
| Persistence              | Spring Data JPA + Hibernate                 | ORM with full control when needed                   |
| Database                 | PostgreSQL 18                               | ACID, JSON support, performance                     |
| Migration                | Flyway                                      | Version-controlled schema changes                   |
| Caching                  | Redis (Spring Cache)                        | Session store, cart cache, rate limiting            |
| Async / Events           | Spring Events (internal) → Kafka (phase 2)  | Decouple notifications, inventory alerts            |
| Mapping                  | MapStruct                                   | Compile-time, zero-reflection DTO mapping           |
| Validation               | Jakarta Validation (Bean Validation 3)      | Declarative, standardized                           |
| API Docs                 | SpringDoc OpenAPI 3 (Swagger UI)            | Auto-generated, always in sync                      |
| Containerization         | Docker + Docker Compose                     | Reproducible dev and prod environments              |
| Logging                  | SLF4J + Logback (structured JSON)           | ELK-compatible structured logs                      |
| Testing                  | JUnit 5, Mockito, Testcontainers            | Unit + integration with real DB                     |
| Build                    | Maven (multi-module)                        | Dependency management, reproducible builds          |
| Code Quality             | Checkstyle, SpotBugs, Jacoco                | Enforce standards, coverage gates                   |

---

## Cross-Cutting Concerns

### Security
- Stateless JWT authentication (access token + refresh token).
- Role-based authorization via `@PreAuthorize`.
- Roles: `CUSTOMER`, `ADMIN`, `WAREHOUSE`, `SUPPORT`, `SYSTEM_ADMIN`.
- Passwords hashed with BCrypt (strength 12).
- No secrets in code — all via environment variables / Spring Config.

### Error Handling
- Single `GlobalExceptionHandler` (`@RestControllerAdvice`).
- All errors return `ApiErrorResponse` with: `timestamp`, `status`, `error`, `message`, `path`, `traceId`.
- Business exceptions extend `BusinessException` (runtime, unchecked).
- HTTP semantics strictly followed.

### Logging
- Structured JSON logs with: `traceId`, `userId`, `module`, `operation`, `durationMs`.
- MDC populated per request by a servlet filter.
- No PII logged (no passwords, no card data).

### Transactions
- `@Transactional` on service implementation methods.
- Read-only queries marked `@Transactional(readOnly = true)`.
- Optimistic locking (`@Version`) on inventory and cart to prevent race conditions.

### Pagination
- All list endpoints paginated — no unbounded queries.
- Default page size: 20, max: 100.
- Response wrapper: `PagedResponse<T>` with `content`, `page`, `size`, `totalElements`, `totalPages`.

### Idempotency
- Order placement and payment endpoints accept `Idempotency-Key` header.
- Duplicate submissions return the same response without side effects.

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
[SecurityFilter]           → Validates JWT, sets SecurityContext
    │
    ▼
[RequestLoggingFilter]     → Sets MDC (traceId, userId)
    │
    ▼
[Controller]               → Validates DTO, calls service
    │
    ▼
[Service]                  → Business logic, throws BusinessExceptions
    │
    ▼
[Repository]               → JPA queries, returns entities
    │
    ▼
[Mapper]                   → Entity → Response DTO
    │
    ▼
HTTP Response
    │
    (on exception)
    ▼
[GlobalExceptionHandler]   → Maps exception to ApiErrorResponse
```

---

## Module Communication Rules

| Rule | Description |
|------|-------------|
| No cross-repo calls | Module A cannot import Module B's repository |
| Service interface only | Module A calls Module B through its service interface |
| No entity leaking | Modules exchange data via DTOs or domain events |
| Events for side effects | Notifications, analytics triggered via Spring `ApplicationEvent` |

---

## Phase 2 Extraction Path (Future)

When traffic demands microservice extraction:
1. Each module's `ApplicationEvent` becomes a Kafka topic.
2. Module's service interface becomes a Feign client.
3. Module gets its own database schema (already isolated via Flyway migration naming).
4. Zero business logic changes required — only infrastructure wiring changes.
