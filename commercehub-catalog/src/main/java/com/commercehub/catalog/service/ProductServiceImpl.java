package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.CreateProductRequest;
import com.commercehub.catalog.dto.ProductFilterRequest;
import com.commercehub.catalog.dto.ProductResponse;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.dto.UpdateProductRequest;
import com.commercehub.catalog.entity.Brand;
import com.commercehub.catalog.entity.Category;
import com.commercehub.catalog.entity.Product;
import com.commercehub.catalog.entity.ProductImage;
import com.commercehub.catalog.entity.ProductStatus;
import com.commercehub.catalog.mapper.ProductMapper;
import com.commercehub.catalog.repository.BrandRepository;
import com.commercehub.catalog.repository.CategoryRepository;
import com.commercehub.catalog.repository.ProductRepository;
import com.commercehub.catalog.repository.ProductSpecification;
import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductMapper productMapper;
    private final InventoryService inventoryService;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              BrandRepository brandRepository,
                              ProductMapper productMapper,
                              InventoryService inventoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productMapper = productMapper;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id, boolean isAdmin) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id, "PRODUCT_NOT_FOUND"));
        if (!isAdmin && product.getStatus() == ProductStatus.INACTIVE) {
            throw new ResourceNotFoundException("Product not found: " + id, "PRODUCT_NOT_FOUND");
        }
        Integer availableStock = inventoryService.getAvailableStock(id);
        return productMapper.toResponse(product, availableStock);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductSummaryResponse getProductSummaryById(UUID id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id, "PRODUCT_NOT_FOUND"));
        Integer availableStock = inventoryService.getAvailableStock(id);
        return productMapper.toSummaryResponse(product, availableStock);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> searchProducts(ProductFilterRequest filter, Pageable pageable, boolean isAdmin) {
        Specification<Product> spec = ProductSpecification.isNotDeleted();
        if (!isAdmin) {
            spec = spec.and(ProductSpecification.hasStatus(ProductStatus.ACTIVE));
        } else if (filter.status() != null) {
            spec = spec.and(ProductSpecification.hasStatus(filter.status()));
        }
        if (filter.categoryId() != null) spec = spec.and(ProductSpecification.hasCategory(filter.categoryId()));
        if (filter.brandId() != null) spec = spec.and(ProductSpecification.hasBrand(filter.brandId()));
        if (filter.minPrice() != null) spec = spec.and(ProductSpecification.hasMinPrice(filter.minPrice()));
        if (filter.maxPrice() != null) spec = spec.and(ProductSpecification.hasMaxPrice(filter.maxPrice()));
        if (filter.search() != null && !filter.search().isBlank()) spec = spec.and(ProductSpecification.matchesSearch(filter.search()));
        Page<Product> products = productRepository.findAll(spec, pageable);
        Map<UUID, Integer> stockMap = inventoryService.getAvailableStock(
                products.getContent().stream().map(Product::getId).toList());
        return products.map(p -> productMapper.toSummaryResponse(p,
                stockMap.getOrDefault(p.getId(), 0)));
    }

    @Override
    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(CreateProductRequest request) {
        if (productRepository.existsBySkuAndDeletedAtIsNull(request.sku())) {
            throw new ConflictException("SKU already exists: " + request.sku(), "SKU_ALREADY_EXISTS");
        }
        Product product = new Product();
        product.setSku(request.sku());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        applyCategories(product, request.categoryIds());
        applyBrand(product, request.brandId());
        applyImages(product, request.images());
        product = productRepository.save(product);
        log.info("Product created: id={}, sku={}", product.getId(), product.getSku());
        return productMapper.toResponse(product, inventoryService.getAvailableStock(product.getId()));
    }

    @Override
    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public ProductResponse updateProduct(UUID id, UpdateProductRequest request) {
        Product product = findActiveOrThrow(id);
        if (request.sku() != null && !request.sku().equals(product.getSku())) {
            if (productRepository.existsBySkuAndDeletedAtIsNull(request.sku())) {
                throw new ConflictException("SKU already exists: " + request.sku(), "SKU_ALREADY_EXISTS");
            }
            product.setSku(request.sku());
        }
        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.categoryIds() != null) applyCategories(product, request.categoryIds());
        if (request.brandId() != null) applyBrand(product, request.brandId());
        if (request.images() != null) applyImages(product, request.images());
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved, inventoryService.getAvailableStock(saved.getId()));
    }

    @Override
    @Transactional
    public ProductResponse updateProductStatus(UUID id, ProductStatus status) {
        Product product = findActiveOrThrow(id);
        product.setStatus(status);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved, inventoryService.getAvailableStock(saved.getId()));
    }

    @Override
    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(UUID id) {
        Product product = findActiveOrThrow(id);
        product.setDeletedAt(Instant.now());
        productRepository.save(product);
        log.info("Product soft-deleted: id={}", id);
    }

    private Product findActiveOrThrow(UUID id) {
        return productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id, "PRODUCT_NOT_FOUND"));
    }

    private void applyCategories(Product product, Set<Long> categoryIds) {
        Set<Category> categories = new HashSet<>();
        for (Long catId : categoryIds) {
            Category cat = categoryRepository.findById(catId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + catId, "CATEGORY_NOT_FOUND"));
            categories.add(cat);
        }
        product.setCategories(categories);
    }

    private void applyBrand(Product product, Long brandId) {
        if (brandId == null) return;
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found: " + brandId, "BRAND_NOT_FOUND"));
        product.setBrand(brand);
    }

    private void applyImages(Product product, List<com.commercehub.catalog.dto.ProductImageRequest> imageRequests) {
        if (imageRequests == null) return;
        product.getImages().clear();
        imageRequests.forEach(req -> {
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setUrl(req.url());
            img.setAltText(req.altText());
            img.setSortOrder(req.sortOrder());
            img.setPrimary(req.isPrimary());
            product.getImages().add(img);
        });
    }
}
