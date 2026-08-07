# TASK-008 — Non-Functional Requirements & Quality Gates

**Priority:** Ongoing — applies to every task  
**These are not optional — they are Definition of Done requirements.**

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Product list API | < 200ms p95 |
| Order placement | < 500ms p95 |
| Auth endpoints | < 100ms p95 |
| Database queries | No query > 100ms (monitor with slow query log) |
| Pagination | All list endpoints paginated — no full table scans |

### Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| Product catalog (public) | Redis | 5 min |
| Category tree | Redis | 30 min (changes rarely) |
| Brand list | Redis | 30 min |
| User session data | Redis (future) | 15 min |

Cache invalidation: When an admin updates a product/category/brand, evict the corresponding cache entry.

Use `@Cacheable`, `@CacheEvict`, and `@CachePut` from Spring Cache abstraction (backed by Redis).

### Database Performance
- All FK columns indexed.
- Product search uses GIN full-text index.
- N+1 queries forbidden — use `JOIN FETCH` or `@EntityGraph` when loading associations.
- Use `@Transactional(readOnly = true)` on all reads — enables read replicas in future.
- Connection pool: HikariCP with `maximumPoolSize: 20`, `minimumIdle: 5`.

---

## Security Requirements

### Input Validation
- All request bodies validated with Bean Validation (`@Valid`).
- String fields: `@NotBlank`, `@Size`, `@Pattern` where applicable.
- Numeric fields: `@Min`, `@Max`, `@DecimalMin` where applicable.
- Email fields: `@Email`.
- UUIDs in path variables validated via Spring's type conversion (auto 400 on invalid UUID format).
- Custom validators for business rules (e.g., `@ValidPassword`, `@ValidCountryCode`).

### SQL Injection Prevention
- Never concatenate user input into queries.
- Always use JPA/JPQL named parameters or Spring Data method naming.
- Native queries must use `@Param` binding.

### Rate Limiting
- Auth endpoints: 10 requests/minute per IP.
- Order placement: 5 orders/minute per user.
- Implement via Bucket4j (add to deps) with Redis backend.
- Return `429 Too Many Requests` with `Retry-After` header.

### Secrets Management
- Zero secrets in source code.
- All sensitive config via environment variables.
- Use Spring `@ConfigurationProperties` with `@Validated`.
- Production: use a secrets manager (AWS Secrets Manager / Vault — documented but not implemented in phase 1).

---

## Observability Requirements

### Logging
Every log entry must include:
- `timestamp`
- `level`
- `traceId` (from MDC)
- `userId` (from MDC, if authenticated)
- `module`
- `operation`
- `message`

Log format: **structured JSON** (configured via Logback `logstash-logback-encoder`).

Log levels:
- `DEBUG` — detailed execution flow (dev only)
- `INFO` — business events (order placed, user registered, status changed)
- `WARN` — recoverable issues (cache miss, retry attempt)
- `ERROR` — unexpected failures (with full stack trace)

**Never log:** passwords, tokens, card data, PII beyond user ID.

### Metrics (Spring Actuator + Micrometer)
Expose via `/actuator/metrics`:
- `http.server.requests` — count, duration per endpoint
- `db.connections` — pool utilization
- Custom counters: `orders.placed.count`, `stock.reservations.failed.count`, `auth.login.failed.count`

### Health Checks
`/actuator/health` exposes:
- Database connectivity
- Redis connectivity
- Disk space

---

## Testing Requirements

### Coverage Gates (enforced by Jacoco)
- Line coverage: ≥ 80% per module
- Branch coverage: ≥ 70% per module
- Coverage gate enforced in Maven build — build fails if below threshold.

### Test Categories

**Unit Tests** (`*Test.java`):
- Run without Spring context — pure Java.
- All dependencies mocked with Mockito.
- Must run in < 5 seconds total per module.
- Test: happy path, each exception path, edge cases.

**Integration Tests** (`*IT.java`):
- Use `@SpringBootTest`.
- Real PostgreSQL via Testcontainers (`postgres:18-alpine`).
- Real Redis via Testcontainers (`redis:7-alpine`).
- Run as part of `mvn verify` (Failsafe plugin), not `mvn test`.
- Must clean DB between tests — use `@Transactional` or `@Sql` to reset state.

**Test Data:**
- Test data builders or `@Builder` Lombok entities for readable test setup.
- No hardcoded UUIDs in tests — generate fresh per test.
- No shared mutable state between tests.

### Test Naming Convention
```
methodName_whenCondition_thenExpectedBehavior()
```
Examples:
- `placeOrder_whenStockInsufficient_thenThrowsInsufficientStockException()`
- `login_whenPasswordIncorrect_thenThrowsAuthenticationException()`
- `addItem_whenProductInactive_thenThrowsBusinessException()`

---

## CI/CD Requirements

### GitHub Actions Pipeline (`ci.yml`)
Triggers: every push to any branch, every PR to `main`.

Steps:
1. Checkout
2. Set up Java 21 (Temurin)
3. Cache Maven dependencies
4. `mvn compile` — fails fast on compilation error
5. `mvn test` — unit tests
6. `mvn verify` — integration tests (with Testcontainers — needs Docker in CI runner)
7. `mvn checkstyle:check` — code style
8. `mvn spotbugs:check` — static analysis
9. `mvn jacoco:report` — generate coverage report
10. Upload coverage report as artifact

### GitHub Actions Pipeline (`cd.yml`)
Triggers: push to `main` (after CI passes).

Steps:
1. Build Docker image: `docker build -t commercehub-api:${{ github.sha }}`
2. Push to container registry
3. (Future: deploy to Kubernetes / ECS)

---

## Definition of Done

A task is **Done** only when ALL of the following are true:

- [ ] Code compiles with zero warnings.
- [ ] All unit tests pass.
- [ ] All integration tests pass.
- [ ] Jacoco coverage ≥ 80% line, ≥ 70% branch for the module.
- [ ] No Checkstyle violations.
- [ ] No SpotBugs warnings (or all suppressed with justification).
- [ ] Swagger UI shows all new endpoints with accurate request/response schemas.
- [ ] Flyway migration files are present and idempotent.
- [ ] All business rules from spec are enforced.
- [ ] Error responses match `ApiErrorResponse` format.
- [ ] No business logic in controllers.
- [ ] No entities returned from controllers.
- [ ] No field injection (`@Autowired` on fields).
- [ ] No hardcoded secrets or config values.
- [ ] Structured logging present for all business operations.
- [ ] PR description references the TASK number.
- [ ] PR reviewed and approved (when team exists).

---

## Pull Request Checklist Template

Copy this into every PR description:

```
## Task
TASK-XXX — [Task name]

## Changes
[Brief description]

## Checklist
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Coverage ≥ 80% for changed classes
- [ ] Swagger updated
- [ ] Flyway migration included (if DB changes)
- [ ] Logging added for business operations
- [ ] Validation added for all request inputs
- [ ] Error responses match ApiErrorResponse
- [ ] No business logic in controllers
- [ ] No entities returned directly
- [ ] No field injection used
- [ ] Security reviewed (auth guards on all endpoints)
```
