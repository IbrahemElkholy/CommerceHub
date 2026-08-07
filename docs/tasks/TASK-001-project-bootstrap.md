# TASK-001 — Project Bootstrap & Common Infrastructure

**Priority:** Critical — Must be done first. All other tasks depend on this.  
**Estimated Effort:** Medium  
**Assignee:** Backend Engineer

---

## Objective

Set up the Maven multi-module project structure, shared infrastructure (security, error handling, logging, response wrappers), and the local development environment.

---

## Acceptance Criteria

- [ ] Maven parent POM created with all dependency versions managed centrally.
- [ ] All module sub-POMs created (even if empty for phase-1 stub modules).
- [ ] Application starts with `docker-compose up` and connects to PostgreSQL and Redis.
- [ ] Health endpoint responds at `GET /actuator/health`.
- [ ] JWT authentication works end-to-end (register → login → access protected endpoint).
- [ ] `GlobalExceptionHandler` returns `ApiErrorResponse` for all error types.
- [ ] Structured JSON logs include `traceId` and `userId` per request.
- [ ] Flyway runs migrations on startup.
- [ ] Swagger UI accessible at `/swagger-ui.html`.

---

## Sub-Tasks

### 1.1 — Maven Parent POM

Create `pom.xml` at project root with:
- `<packaging>pom</packaging>`
- Spring Boot parent: `3.x.x`
- Java 21
- `<dependencyManagement>` block for:
  - Spring Boot starters (web, security, data-jpa, validation, actuator, cache)
  - PostgreSQL driver
  - Flyway
  - Redis (spring-boot-starter-data-redis)
  - JJWT (io.jsonwebtoken) — all three artifacts
  - MapStruct
  - Lombok (with MapStruct processor ordering)
  - SpringDoc OpenAPI
  - Testcontainers (BOM)
  - JUnit 5
- `<modules>` listing all sub-modules
- Plugin management: `maven-compiler-plugin` (Java 21, annotation processors), `maven-surefire-plugin`, Jacoco

### 1.2 — commercehub-common Module

Create the shared library used by all other modules.

**Entities/Base classes:**
- `AuditableEntity` — abstract base with `@CreatedDate`, `@LastModifiedDate`, `@Version`; uses `@EntityListeners(AuditingEntityListener.class)`

**Response wrappers:**
- `ApiResponse<T>` — record with `success`, `data`, `timestamp`
- `ApiErrorResponse` — record with `success=false`, `error` block containing: `status`, `code`, `message`, `path`, `traceId`, `timestamp`, `fieldErrors`
- `PagedResponse<T>` — wraps Spring `Page<T>` into a JSON-serializable structure
- `FieldError` — record with `field` and `message`

**Exceptions:**
- `BusinessException` — abstract base extending `RuntimeException`; carries `errorCode: String`
- `ResourceNotFoundException` extends `BusinessException`
- `ConflictException` extends `BusinessException`
- `InsufficientStockException` extends `BusinessException`
- `InvalidOrderStateException` extends `BusinessException`
- `InvalidTokenException` extends `BusinessException`

**Global Exception Handler:**
- `GlobalExceptionHandler` annotated `@RestControllerAdvice`
- Handle: `MethodArgumentNotValidException` → 422
- Handle: `ResourceNotFoundException` → 404
- Handle: `ConflictException` → 409
- Handle: `InsufficientStockException` → 409
- Handle: `InvalidOrderStateException` → 422
- Handle: `AccessDeniedException` → 403
- Handle: `AuthenticationException` → 401
- Handle: `HttpMessageNotReadableException` → 400
- Handle: `Exception` (catch-all) → 500 (log full stack trace, never expose internals)

**Security:**
- `JwtService` — interface with: `generateAccessToken(UserDetails)`, `generateRefreshToken()`, `validateToken(String)`, `extractUserId(String)`, `extractRoles(String)`
- `JwtServiceImpl` — implementation using JJWT, reads secret and expiry from `@ConfigurationProperties`
- `JwtProperties` — `@ConfigurationProperties(prefix = "security.jwt")` with `secret`, `accessTokenExpiry`, `refreshTokenExpiry`
- `JwtAuthFilter` extends `OncePerRequestFilter` — extracts Bearer token, validates, sets `SecurityContextHolder`
- `SecurityConstants` — constants for role names, header names

**Logging/MDC:**
- `RequestLoggingFilter` — servlet filter that sets MDC with `traceId` (UUID), reads `X-Request-ID` header if present, sets `userId` from security context after authentication, clears MDC in `finally`

### 1.3 — Docker Compose (dev)

`docker/docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:18-alpine
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    ports: 5432:5432
    volumes: postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports: 6379:6379
  mailhog:
    image: mailhog/mailhog
    ports: 1025:1025 (SMTP), 8025:8025 (UI)
```

### 1.4 — Application Configuration

`application.yml`:
- DataSource pointing to localhost:5432 (dev profile)
- JPA: `ddl-auto: validate`, show-sql: false
- Flyway: enabled, locations per module
- Redis connection
- Actuator: expose health, info, metrics
- Security JWT properties (externalised — no defaults in code)
- Logging: JSON format, level INFO for app, ERROR for everything else
- SpringDoc: enabled, path `/swagger-ui.html`, group all modules

`application-dev.yml`:
- Datasource with dev credentials
- Logging level DEBUG for `com.commercehub`
- CORS permissive for `localhost:3000`

`application-prod.yml`:
- All sensitive values via environment variables (no hardcoded values)
- Connection pool sized appropriately (HikariCP)
- Logging JSON, level INFO

### 1.5 — Dockerfile

Multi-stage Dockerfile:
- Stage 1: `maven:3.9-eclipse-temurin-21` — build and package
- Stage 2: `eclipse-temurin:21-jre-alpine` — copy JAR, expose 8080, set `JAVA_OPTS`

### 1.6 — Spring Security Configuration

`SecurityConfig` (`@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`):
- `SecurityFilterChain` bean
- Stateless session (`STATELESS`)
- CSRF disabled (stateless API)
- Permit all: `/api/v1/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health`
- Everything else: authenticated
- Register `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`
- `UserDetailsService` bean pointing to `UserRepository`
- `PasswordEncoder` bean: `BCryptPasswordEncoder(12)`
- `AuthenticationManager` bean

---

## Implementation Notes

- Use `@ConfigurationProperties` over `@Value` for grouped config.
- `JwtService` must be in `common` — shared by identity module and the security filter.
- `AuditableEntity` uses `@MappedSuperclass` — never annotate it with `@Entity`.
- All exception `errorCode` values must be `SCREAMING_SNAKE_CASE` strings matching the HTTP error code convention.
- `traceId` must propagate through the entire request — set in filter, available in logs, returned in error responses.
