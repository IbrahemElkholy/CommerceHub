# TASK-003 — Product Catalog Module

**Priority:** High  
**Estimated Effort:** Large  
**Depends On:** TASK-001, TASK-002  
**Module:** `commercehub-catalog`

---

## Objective

Build the product catalog with categories (tree structure), brands, products with filtering/search/pagination, and image management.

---

## Acceptance Criteria

- [ ] Admin can create, update, soft-delete products.
- [ ] Product SKU is globally unique — duplicate returns 409.
- [ ] Product must belong to at least one category — enforced in service.
- [ ] Inactive/deleted products not returned in public endpoints.
- [ ] Products filterable by: `category`, `brand`, `minPrice`, `maxPrice`, `status`, full-text `search`.
- [ ] All product list responses paginated.
- [ ] Category tree returned (parent → children nested).
- [ ] Brand CRUD available to admin.
- [ ] All endpoints Swagger-documented.
- [ ] Unit and integration tests pass.

---

## Sub-Tasks

### 3.1 — Flyway Migrations

- `V2.0.0__create_categories_table.sql`
- `V2.0.1__create_brands_table.sql`
- `V2.0.2__create_products_table.sql`
- `V2.0.3__create_product_categories_table.sql`
- `V2.0.4__create_product_images_table.sql`
- `V2.0.5__add_product_fulltext_search_index.sql` — GIN index on `to_tsvector`

### 3.2 — Entities

**`Category`** (`@Entity`, `@Table(name = "categories")`):
- `id: Long`, `name: String`, `slug: String`, `description: String`
- `parent: Category` → `@ManyToOne(fetch = LAZY)` (nullable)
- `children: List<Category>` → `@OneToMany(mappedBy = "parent", fetch = LAZY)`
- No `@Data` — explicit getters, `equals`/`hashCode` on `id`

**`Brand`** (`@Entity`, `@Table(name = "brands")`):
- `id: Long`, `name: String`, `slug: String`, `logoUrl: String`

**`Product`** (`@Entity`, `@Table(name = "products")`):
- All fields from domain model
- `categories: Set<Category>` → `@ManyToMany`, join table `product_categories`
- `brand: Brand` → `@ManyToOne(fetch = LAZY)`
- `images: List<ProductImage>` → `@OneToMany(mappedBy = "product", cascade = ALL, orphanRemoval = true)`
- `dimensions: Dimensions` → `@Embedded` (value object: `weightKg`, `lengthCm`, `widthCm`, `heightCm`)
- `deletedAt: Instant` (null = not deleted)
- Extends `AuditableEntity`

**`ProductImage`** (`@Entity`, `@Table(name = "product_images")`):
- `id: UUID`, `product: Product (ManyToOne)`, `url: String`, `altText: String`, `sortOrder: int`, `isPrimary: boolean`

**`Dimensions`** (`@Embeddable`):
- `weightKg: BigDecimal`, `lengthCm: BigDecimal`, `widthCm: BigDecimal`, `heightCm: BigDecimal`

### 3.3 — Repositories

**`ProductRepository extends JpaRepository<Product, UUID>`**:
- `findByIdAndDeletedAtIsNull(UUID id): Optional<Product>`
- `findBySkuAndDeletedAtIsNull(String sku): Optional<Product>`
- `existsBySkuAndDeletedAtIsNull(String sku): boolean`
- `findAll(Specification<Product> spec, Pageable pageable): Page<Product>` — for dynamic filtering

**`ProductSpecification`** (static factory class or `Specification<Product>` methods):
- `hasCategory(Long categoryId)` — join through `categories`
- `hasBrand(Long brandId)`
- `hasStatus(ProductStatus status)`
- `hasMinPrice(BigDecimal min)`
- `hasMaxPrice(BigDecimal max)`
- `matchesSearch(String search)` — native query or LIKE on name/description
- `isNotDeleted()` — `deletedAt IS NULL`
- These are combined with `Specification.where().and()` in the service.

**`CategoryRepository extends JpaRepository<Category, Long>`**:
- `findBySlug(String slug): Optional<Category>`
- `findAllByParentIsNull(): List<Category>` — top-level categories
- `existsByName(String name): boolean`

**`BrandRepository extends JpaRepository<Brand, Long>`**:
- `findBySlug(String slug): Optional<Brand>`
- `existsByName(String name): boolean`

### 3.4 — DTOs

**Requests:**
- `CreateProductRequest` — `sku` (@NotBlank), `name` (@NotBlank), `description`, `price` (@NotNull @DecimalMin("0.01")), `brandId`, `categoryIds` (@NotEmpty, @Size min=1), `images: List<ProductImageRequest>`
- `UpdateProductRequest` — same fields, all optional
- `ProductFilterRequest` — query params: `categoryId`, `brandId`, `minPrice`, `maxPrice`, `search`, `status`
- `CreateCategoryRequest` — `name` (@NotBlank), `slug` (@NotBlank), `description`, `parentId` (nullable)
- `UpdateCategoryRequest` — same, all optional
- `CreateBrandRequest` — `name` (@NotBlank), `slug` (@NotBlank), `logoUrl`
- `ProductImageRequest` — `url` (@NotBlank @URL), `altText`, `sortOrder`, `isPrimary`

**Responses:**
- `ProductResponse` — all product fields including full category list, brand, images
- `ProductSummaryResponse` — `id`, `sku`, `name`, `price`, `status`, primary image URL, brand name (for list views)
- `CategoryResponse` — `id`, `name`, `slug`, `description`, `parentId`, `children: List<CategoryResponse>` (recursive)
- `CategorySummaryResponse` — `id`, `name`, `slug` (for product response)
- `BrandResponse` — `id`, `name`, `slug`, `logoUrl`

### 3.5 — Mappers

**`ProductMapper`** (MapStruct):
- `toResponse(Product): ProductResponse`
- `toSummaryResponse(Product): ProductSummaryResponse`
- `toImageResponse(ProductImage): ProductImageResponse`

**`CategoryMapper`** (MapStruct):
- `toResponse(Category): CategoryResponse` — must recursively map children
- `toSummaryResponse(Category): CategorySummaryResponse`

**`BrandMapper`** (MapStruct):
- `toResponse(Brand): BrandResponse`

### 3.6 — Services

**`ProductService` interface + `ProductServiceImpl`:**

```
getProductById(UUID id) → ProductResponse
  - Find by id where deletedAt IS NULL → 404 if not found
  - If status = INACTIVE and caller is not ADMIN → 404 (don't reveal inactive products)

searchProducts(ProductFilterRequest, Pageable) → Page<ProductSummaryResponse>
  - Build Specification from filter params
  - Public callers: force status = ACTIVE, deletedAt IS NULL
  - Admin callers: no status filter applied
  - Execute findAll(spec, pageable)

createProduct(CreateProductRequest) → ProductResponse   [ADMIN]
  - Validate SKU uniqueness → ConflictException
  - Validate categoryIds all exist → ResourceNotFoundException
  - Validate brandId exists if provided
  - Save product, return response

updateProduct(UUID id, UpdateProductRequest) → ProductResponse   [ADMIN]
  - Find product → 404
  - If SKU changed: validate new SKU unique
  - Update only non-null fields (partial update semantics)
  - Save and return

updateProductStatus(UUID id, ProductStatus status) → ProductResponse   [ADMIN]
  - Find product → 404
  - Update status, save

deleteProduct(UUID id)   [ADMIN]
  - Find product → 404
  - Set deletedAt = now()
  - Do NOT physically delete
```

**`CategoryService` interface + `CategoryServiceImpl`:**

```
getCategoryTree() → List<CategoryResponse>
  - Fetch all top-level categories (parentId IS NULL)
  - MapStruct recursively maps children (loaded via LAZY → trigger within transaction)

createCategory(CreateCategoryRequest) → CategoryResponse   [ADMIN]
  - Validate name unique → ConflictException
  - Validate parentId exists if provided
  - Save

updateCategory(Long id, UpdateCategoryRequest) → CategoryResponse   [ADMIN]
deleteCategory(Long id)   [ADMIN]
  - Verify no products assigned → BusinessException if products exist
```

**`BrandService` interface + `BrandServiceImpl`:**

```
getAllBrands(Pageable) → Page<BrandResponse>
getBrandById(Long id) → BrandResponse
createBrand(CreateBrandRequest) → BrandResponse   [ADMIN]
updateBrand(Long id, UpdateBrandRequest) → BrandResponse   [ADMIN]
```

### 3.7 — Controllers

**`ProductController`** (`/api/v1/catalog/products`):
- `GET /` — public, accepts filter query params, delegates to `searchProducts`
- `GET /{id}` — public
- `POST /` — `@PreAuthorize("hasRole('ADMIN')")`
- `PUT /{id}` — ADMIN
- `PATCH /{id}/status` — ADMIN
- `DELETE /{id}` — ADMIN
- Each endpoint annotated with `@Operation`, `@ApiResponses`

**`CategoryController`** (`/api/v1/catalog/categories`):
- `GET /` — public (returns tree)
- `POST /`, `PUT /{id}`, `DELETE /{id}` — ADMIN

**`BrandController`** (`/api/v1/catalog/brands`):
- `GET /` — public
- `POST /`, `PUT /{id}` — ADMIN

### 3.8 — Tests

**Unit Tests:**
- `ProductServiceImplTest` — mock repos and mapper
  - `getProductById`: found, not found, inactive product blocked for non-admin
  - `createProduct`: success, duplicate SKU, missing category
  - `updateProduct`: success, SKU conflict on update
  - `deleteProduct`: sets `deletedAt`, does not hard delete
  - `searchProducts`: verifies Specification construction for each filter param
- `CategoryServiceImplTest` — tree construction, duplicate name

**Integration Tests:**
- `ProductControllerIT` with Testcontainers
  - CRUD flow end-to-end
  - Filter and search
  - Auth guards (403 for non-admin create)
  - Soft delete: product not returned after delete

---

## Business Rules Enforced

| Rule | Where |
|------|-------|
| SKU unique | `ProductRepository.existsBySku` + DB constraint |
| Product must have ≥1 category | `ProductService.createProduct` validates `categoryIds` not empty |
| Inactive products hidden from public | `searchProducts` + `getProductById` filter by caller role |
| Soft delete only | `deleteProduct` sets `deletedAt`, never hard-deletes |
| Deleted products invisible | All queries filter `deletedAt IS NULL` |
