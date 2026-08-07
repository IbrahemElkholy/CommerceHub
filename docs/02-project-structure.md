# Project Structure — CommerceHub

## Maven Multi-Module Layout

```
commercehub/
├── pom.xml                          ← Parent POM (dependency management)
│
├── commercehub-app/                 ← Main Spring Boot application (bootstrap only)
│   ├── src/main/java/
│   │   └── com/commercehub/
│   │       └── CommerceHubApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   └── application-prod.yml
│   └── pom.xml
│
├── commercehub-common/              ← Shared utilities, no business logic
│   ├── src/main/java/
│   │   └── com/commercehub/common/
│   │       ├── exception/
│   │       │   ├── BusinessException.java
│   │       │   ├── ResourceNotFoundException.java
│   │       │   ├── ConflictException.java
│   │       │   └── ValidationException.java
│   │       ├── response/
│   │       │   ├── ApiResponse.java
│   │       │   ├── ApiErrorResponse.java
│   │       │   └── PagedResponse.java
│   │       ├── handler/
│   │       │   └── GlobalExceptionHandler.java
│   │       ├── filter/
│   │       │   └── RequestLoggingFilter.java
│   │       ├── security/
│   │       │   ├── JwtService.java
│   │       │   ├── JwtAuthFilter.java
│   │       │   └── SecurityConstants.java
│   │       └── audit/
│   │           └── AuditableEntity.java  ← Base entity with createdAt/updatedAt
│   └── pom.xml
│
├── commercehub-identity/            ← Identity & Access Management Module
│   ├── src/main/java/
│   │   └── com/commercehub/identity/
│   │       ├── controller/
│   │       │   ├── AuthController.java
│   │       │   └── UserController.java
│   │       ├── dto/
│   │       │   ├── request/
│   │       │   │   ├── RegisterRequest.java
│   │       │   │   ├── LoginRequest.java
│   │       │   │   ├── PasswordResetRequest.java
│   │       │   │   └── RefreshTokenRequest.java
│   │       │   └── response/
│   │       │       ├── AuthResponse.java
│   │       │       └── UserResponse.java
│   │       ├── entity/
│   │       │   ├── User.java
│   │       │   ├── Role.java
│   │       │   ├── RefreshToken.java
│   │       │   └── PasswordResetToken.java
│   │       ├── repository/
│   │       │   ├── UserRepository.java
│   │       │   ├── RoleRepository.java
│   │       │   └── RefreshTokenRepository.java
│   │       ├── service/
│   │       │   ├── AuthService.java             ← interface
│   │       │   ├── AuthServiceImpl.java
│   │       │   ├── UserService.java             ← interface
│   │       │   └── UserServiceImpl.java
│   │       └── mapper/
│   │           └── UserMapper.java
│   ├── src/main/resources/db/migration/identity/
│   │   ├── V1.0.0__create_users_table.sql
│   │   ├── V1.0.1__create_roles_table.sql
│   │   └── V1.0.2__create_refresh_tokens_table.sql
│   └── pom.xml
│
├── commercehub-catalog/             ← Product Catalog Module
│   ├── src/main/java/
│   │   └── com/commercehub/catalog/
│   │       ├── controller/
│   │       │   ├── CategoryController.java
│   │       │   ├── BrandController.java
│   │       │   └── ProductController.java
│   │       ├── dto/
│   │       │   ├── request/
│   │       │   │   ├── CreateProductRequest.java
│   │       │   │   ├── UpdateProductRequest.java
│   │       │   │   ├── CreateCategoryRequest.java
│   │       │   │   └── ProductFilterRequest.java
│   │       │   └── response/
│   │       │       ├── ProductResponse.java
│   │       │       ├── ProductSummaryResponse.java
│   │       │       └── CategoryResponse.java
│   │       ├── entity/
│   │       │   ├── Product.java
│   │       │   ├── Category.java
│   │       │   ├── Brand.java
│   │       │   └── ProductImage.java
│   │       ├── repository/
│   │       │   ├── ProductRepository.java
│   │       │   ├── CategoryRepository.java
│   │       │   └── ProductSpecification.java    ← JPA Specification for filtering
│   │       ├── service/
│   │       │   ├── ProductService.java
│   │       │   ├── ProductServiceImpl.java
│   │       │   ├── CategoryService.java
│   │       │   └── CategoryServiceImpl.java
│   │       └── mapper/
│   │           ├── ProductMapper.java
│   │           └── CategoryMapper.java
│   ├── src/main/resources/db/migration/catalog/
│   │   ├── V2.0.0__create_categories_table.sql
│   │   ├── V2.0.1__create_brands_table.sql
│   │   └── V2.0.2__create_products_table.sql
│   └── pom.xml
│
├── commercehub-inventory/           ← Inventory Module
│   ├── src/main/java/
│   │   └── com/commercehub/inventory/
│   │       ├── controller/
│   │       │   ├── WarehouseController.java
│   │       │   └── StockController.java
│   │       ├── dto/
│   │       ├── entity/
│   │       │   ├── Warehouse.java
│   │       │   ├── StockItem.java               ← product + warehouse + quantity
│   │       │   ├── StockReservation.java
│   │       │   └── StockAdjustment.java
│   │       ├── repository/
│   │       ├── service/
│   │       │   ├── InventoryService.java        ← interface (used by Order module)
│   │       │   └── InventoryServiceImpl.java
│   │       └── mapper/
│   └── pom.xml
│
├── commercehub-cart/                ← Shopping Cart Module
│   ├── src/main/java/
│   │   └── com/commercehub/cart/
│   │       ├── controller/
│   │       │   └── CartController.java
│   │       ├── dto/
│   │       ├── entity/
│   │       │   ├── Cart.java
│   │       │   └── CartItem.java
│   │       ├── repository/
│   │       ├── service/
│   │       │   ├── CartService.java
│   │       │   └── CartServiceImpl.java
│   │       └── mapper/
│   └── pom.xml
│
├── commercehub-order/               ← Order Management Module
│   ├── src/main/java/
│   │   └── com/commercehub/order/
│   │       ├── controller/
│   │       │   └── OrderController.java
│   │       ├── dto/
│   │       ├── entity/
│   │       │   ├── Order.java
│   │       │   ├── OrderItem.java
│   │       │   └── OrderStatusHistory.java
│   │       ├── enums/
│   │       │   └── OrderStatus.java
│   │       ├── repository/
│   │       ├── service/
│   │       │   ├── OrderService.java
│   │       │   └── OrderServiceImpl.java
│   │       └── mapper/
│   └── pom.xml
│
├── commercehub-payment/             ← Payment Module (stub for phase 1)
│   └── pom.xml
│
├── commercehub-shipping/            ← Shipping Module
│   └── pom.xml
│
├── commercehub-notifications/       ← Notifications Module
│   └── pom.xml
│
├── commercehub-reviews/             ← Reviews Module
│   └── pom.xml
│
├── commercehub-promotions/          ← Promotions Module
│   └── pom.xml
│
├── commercehub-analytics/           ← Analytics Module
│   └── pom.xml
│
├── commercehub-wishlist/            ← Wishlist Module
│   └── pom.xml
│
├── docker/
│   ├── docker-compose.yml           ← Dev environment (Postgres, Redis, Mailhog)
│   ├── docker-compose.prod.yml
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   ← Build, test, code quality
│       └── cd.yml                   ← Deploy on merge to main
│
└── docs/
    ├── 01-architecture.md
    ├── 02-project-structure.md
    ├── 03-domain-model.md
    ├── 04-database-design.md
    ├── 05-api-standards.md
    ├── 06-security.md
    └── tasks/
        ├── TASK-001-identity-module.md
        ├── TASK-002-catalog-module.md
        ├── TASK-003-inventory-module.md
        ├── TASK-004-cart-module.md
        ├── TASK-005-order-module.md
        ├── TASK-006-payment-module.md
        ├── TASK-007-shipping-module.md
        ├── TASK-008-notifications-module.md
        ├── TASK-009-reviews-module.md
        ├── TASK-010-promotions-module.md
        ├── TASK-011-analytics-module.md
        └── TASK-012-wishlist-module.md
```

---

## Package Naming Convention

```
com.commercehub.<module>.<layer>
```

Examples:
- `com.commercehub.catalog.service.ProductServiceImpl`
- `com.commercehub.order.controller.OrderController`
- `com.commercehub.identity.entity.User`

---

## Layer Responsibilities (Strict)

| Layer | Responsibility | Must NOT |
|-------|---------------|----------|
| `controller` | Receive HTTP, validate DTO, call service, return response | Contain business logic, access repos |
| `service` | All business logic, transactions | Access other module's repos, return entities |
| `repository` | Persistence only, JPA queries | Contain business logic |
| `entity` | JPA mapping only | Contain business logic, reference DTOs |
| `dto` | Data transfer only | Reference entities, contain logic |
| `mapper` | Entity ↔ DTO conversion | Contain business logic |
| `event` | Domain event definitions | Contain business logic |
