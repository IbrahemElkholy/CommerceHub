# TASK-002 — Identity Module (Authentication & User Management)

**Priority:** Critical — Required before any other module.  
**Estimated Effort:** Large  
**Depends On:** TASK-001  
**Module:** `commercehub-identity`

---

## Objective

Implement a complete authentication and user management system with JWT-based stateless auth, role-based access control, email verification, and password reset.

---

## Acceptance Criteria

- [ ] Customer can register with email + password.
- [ ] Duplicate email returns 409 Conflict.
- [ ] Passwords are BCrypt hashed (never stored plain).
- [ ] Login returns access token (15 min) + refresh token (7 days).
- [ ] Access token validates on protected endpoints.
- [ ] Refresh token rotates on use (old token revoked, new issued).
- [ ] Logout revokes refresh token.
- [ ] Password reset flow works end-to-end (request email → click link → reset).
- [ ] Admin can list, view, suspend/activate users.
- [ ] Customer can manage their own addresses (CRUD).
- [ ] All endpoints documented in Swagger.
- [ ] Unit tests cover all service methods.
- [ ] Integration tests cover all controller endpoints.
- [ ] Flyway migrations create all tables correctly.

---

## Sub-Tasks

### 2.1 — Flyway Migrations

Create the following SQL migration files in `src/main/resources/db/migration/`:

- `V1.0.0__create_users_table.sql`
- `V1.0.1__create_roles_table.sql`
- `V1.0.2__create_user_roles_table.sql`
- `V1.0.3__create_refresh_tokens_table.sql`
- `V1.0.4__create_password_reset_tokens_table.sql`
- `V1.0.5__create_addresses_table.sql`
- `V1.0.6__seed_roles.sql` (insert 5 default roles)

Exact DDL defined in `docs/04-database-design.md`.

### 2.2 — Entities

**`User`** (`@Entity`, `@Table(name = "users")`):
- Fields as per domain model
- `roles`: `@ManyToMany(fetch = FetchType.LAZY)` via `user_roles` join table
- `addresses`: `@OneToMany(mappedBy = "user", cascade = ALL, orphanRemoval = true)`
- Implement `UserDetails` interface (for Spring Security `UserDetailsService`)
- `getAuthorities()` maps roles to `GrantedAuthority`
- `isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()` based on `status`
- Never add `@Data` — use explicit getters, `equals`/`hashCode` on `id` only

**`Role`** (`@Entity`, `@Table(name = "roles")`):
- `id: Long`, `name: RoleName (enum)` — store enum as string

**`RefreshToken`** (`@Entity`, `@Table(name = "refresh_tokens")`):
- `id: UUID`, `user: User (ManyToOne)`, `tokenHash: String`, `expiresAt: Instant`, `revoked: boolean`

**`PasswordResetToken`** (`@Entity`, `@Table(name = "password_reset_tokens")`):
- `id: UUID`, `user: User (ManyToOne)`, `tokenHash: String`, `expiresAt: Instant`, `used: boolean`

**`Address`** (`@Entity`, `@Table(name = "addresses")`):
- `id: UUID`, `user: User (ManyToOne)`, address fields, `isDefault: boolean`

### 2.3 — Repositories

- `UserRepository extends JpaRepository<User, UUID>`:
  - `findByEmail(String email): Optional<User>`
  - `existsByEmail(String email): boolean`
  - `findAllByStatus(UserStatus status, Pageable pageable): Page<User>`

- `RoleRepository extends JpaRepository<Role, Long>`:
  - `findByName(RoleName name): Optional<Role>`

- `RefreshTokenRepository extends JpaRepository<RefreshToken, UUID>`:
  - `findByTokenHash(String hash): Optional<RefreshToken>`
  - `deleteAllByUserId(UUID userId)`

- `PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID>`:
  - `findByTokenHash(String hash): Optional<PasswordResetToken>`

- `AddressRepository extends JpaRepository<Address, UUID>`:
  - `findAllByUserId(UUID userId): List<Address>`
  - `findByIdAndUserId(UUID id, UUID userId): Optional<Address>`
  - `countByUserId(UUID userId): long`

### 2.4 — DTOs

**Requests (records, all fields validated):**
- `RegisterRequest` — `email` (@Email), `password` (@Size min=8), `firstName` (@NotBlank), `lastName` (@NotBlank)
- `LoginRequest` — `email` (@Email @NotBlank), `password` (@NotBlank)
- `RefreshTokenRequest` — `refreshToken` (@NotBlank)
- `PasswordResetRequestDto` — `email` (@Email @NotBlank)
- `PasswordResetDto` — `token` (@NotBlank), `newPassword` (@Size min=8)
- `UpdateUserRequest` — `firstName`, `lastName`, `phone` (all optional, nullable)
- `CreateAddressRequest` — all address fields with @NotBlank where required, `countryCode` @Size(2,2)
- `UpdateAddressRequest` — same as Create, all optional

**Responses (records):**
- `AuthResponse` — `accessToken`, `tokenType="Bearer"`, `expiresIn` (seconds)
- `UserResponse` — `id`, `email`, `firstName`, `lastName`, `phone`, `status`, `roles`, `emailVerified`, `createdAt`
- `UserSummaryResponse` — `id`, `email`, `fullName`, `status` (for admin lists)
- `AddressResponse` — all address fields + `id`, `isDefault`

### 2.5 — Mapper

`UserMapper` (MapStruct interface, `@Mapper(componentModel = "spring")`):
- `toResponse(User user): UserResponse`
- `toSummaryResponse(User user): UserSummaryResponse`
- `toAddressResponse(Address address): AddressResponse`

### 2.6 — Services

**`AuthService` interface + `AuthServiceImpl`:**

```
register(RegisterRequest) → AuthResponse
  1. Check email not already taken → ConflictException if taken
  2. Hash password with BCrypt
  3. Assign CUSTOMER role
  4. Save user
  5. Generate access + refresh tokens
  6. Publish UserRegisteredEvent (for notifications)
  7. Return AuthResponse

login(LoginRequest) → AuthResponse
  1. Load user by email → ResourceNotFoundException if not found
  2. Verify password → AuthenticationException if wrong
  3. Check user status → AuthenticationException if SUSPENDED
  4. Revoke existing refresh tokens for user (optional: allow multiple sessions)
  5. Generate new access + refresh tokens
  6. Return AuthResponse

refreshToken(RefreshTokenRequest) → AuthResponse
  1. Hash incoming token, find in DB → InvalidTokenException if not found
  2. Check not revoked, not expired → InvalidTokenException
  3. Revoke old token (rotation)
  4. Issue new access + refresh tokens
  5. Return AuthResponse

logout(String refreshToken)
  1. Hash token, find in DB
  2. Mark as revoked
  3. Return

requestPasswordReset(PasswordResetRequestDto)
  1. Find user by email (silently ignore if not found — don't leak existence)
  2. Generate secure random token, hash it, store with 1h expiry
  3. Publish PasswordResetRequestedEvent (for notifications)

resetPassword(PasswordResetDto)
  1. Hash token, find in DB → InvalidTokenException if not found/used/expired
  2. Update user password (BCrypt hash)
  3. Mark token as used
  4. Revoke all refresh tokens for user (force re-login)
```

**`UserService` interface + `UserServiceImpl`:**

```
getOwnProfile(UUID userId) → UserResponse
updateOwnProfile(UUID userId, UpdateUserRequest) → UserResponse
getAllUsers(Pageable) → Page<UserSummaryResponse>   [ADMIN]
getUserById(UUID id) → UserResponse                  [ADMIN]
updateUserStatus(UUID id, UserStatus) → UserResponse [ADMIN]
getAddresses(UUID userId) → List<AddressResponse>
addAddress(UUID userId, CreateAddressRequest) → AddressResponse
updateAddress(UUID userId, UUID addressId, UpdateAddressRequest) → AddressResponse
deleteAddress(UUID userId, UUID addressId)
setDefaultAddress(UUID userId, UUID addressId)
```

### 2.7 — Controllers

**`AuthController`** (`@RestController`, `@RequestMapping("/api/v1/auth")`, `@Tag(name = "Authentication")`):
- All endpoints in the Auth section of the API catalog.
- DTOs validated with `@Valid`.
- Returns `ApiResponse<AuthResponse>` or `ApiResponse<Void>`.
- No business logic — only call service + return.

**`UserController`** (`@RestController`, `@RequestMapping("/api/v1/users")`, `@Tag(name = "Users")`):
- `GET /me` — `@PreAuthorize("isAuthenticated()")`
- `PATCH /me` — `@PreAuthorize("isAuthenticated()")`
- `GET /{id}` — `@PreAuthorize("hasRole('ADMIN')")`
- `GET /` — `@PreAuthorize("hasRole('ADMIN')")`
- Address sub-endpoints — `@PreAuthorize("hasRole('CUSTOMER')")`

### 2.8 — Refresh Token Storage Strategy

- Raw token is a 256-bit `SecureRandom` hex string → sent to client.
- Stored in DB as `SHA-256(rawToken)` → never store raw.
- On validation: hash incoming → lookup hash in DB.

### 2.9 — Tests

**Unit Tests (`*ServiceImplTest`):**
- Mock all repositories and `JwtService`.
- Test each service method: happy path + each exception path.
- Test password hashing (verify `BCryptPasswordEncoder.matches`).
- Test token rotation (verify old token marked revoked).
- Test status enforcement on login.

**Integration Tests (`*ControllerIT`):**
- Extend a base class that starts a real PostgreSQL via Testcontainers.
- Use `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` or MockMvc.
- Test: register → login → access protected endpoint with token.
- Test: refresh token rotation.
- Test: duplicate email → 409.
- Test: invalid credentials → 401.
- Test: suspended user login → 401.
- Test: ADMIN accessing user list with CUSTOMER token → 403.

---

## Business Rules Enforced

| Rule | Where |
|------|-------|
| Email globally unique | `UserRepository.existsByEmail` + DB constraint |
| Password minimum 8 chars | `RegisterRequest` Bean Validation |
| Password stored hashed | `AuthServiceImpl.register` |
| Suspended users cannot log in | `AuthServiceImpl.login` |
| Refresh token rotation on use | `AuthServiceImpl.refreshToken` |
| Password reset forces re-login | `AuthServiceImpl.resetPassword` revokes all tokens |
| Admin cannot be registered via public endpoint | Role assignment in `register()` always sets CUSTOMER |
