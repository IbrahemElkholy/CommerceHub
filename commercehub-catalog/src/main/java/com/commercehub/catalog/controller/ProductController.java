package com.commercehub.catalog.controller;

import com.commercehub.catalog.dto.CreateProductRequest;
import com.commercehub.catalog.dto.ProductFilterRequest;
import com.commercehub.catalog.dto.ProductResponse;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.dto.UpdateProductRequest;
import com.commercehub.catalog.entity.ProductStatus;
import com.commercehub.catalog.service.ProductService;
import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog/products")
@Tag(name = "Products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Search/list products")
    public ApiResponse<PagedResponse<ProductSummaryResponse>> search(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        ProductFilterRequest filter = new ProductFilterRequest(categoryId, brandId, minPrice, maxPrice, search, status);
        return ApiResponse.ok(PagedResponse.from(productService.searchProducts(filter, pageable, isAdmin)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ApiResponse<ProductResponse> getById(@PathVariable UUID id, Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ApiResponse.ok(productService.getProductById(id, isAdmin));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create product (admin)")
    public ApiResponse<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product (admin)")
    public ApiResponse<ProductResponse> update(@PathVariable UUID id,
                                                @RequestBody UpdateProductRequest request) {
        return ApiResponse.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product status (admin)")
    public ApiResponse<ProductResponse> updateStatus(@PathVariable UUID id,
                                                      @RequestParam ProductStatus status) {
        return ApiResponse.ok(productService.updateProductStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft-delete product (admin)")
    public void delete(@PathVariable UUID id) {
        productService.deleteProduct(id);
    }
}
