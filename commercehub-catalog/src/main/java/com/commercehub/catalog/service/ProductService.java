package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.CreateProductRequest;
import com.commercehub.catalog.dto.ProductFilterRequest;
import com.commercehub.catalog.dto.ProductResponse;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.dto.UpdateProductRequest;
import com.commercehub.catalog.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    ProductResponse getProductById(UUID id, boolean isAdmin);

    ProductSummaryResponse getProductSummaryById(UUID id);

    Page<ProductSummaryResponse> searchProducts(ProductFilterRequest filter, Pageable pageable, boolean isAdmin);

    ProductResponse createProduct(CreateProductRequest request);

    ProductResponse updateProduct(UUID id, UpdateProductRequest request);

    ProductResponse updateProductStatus(UUID id, ProductStatus status);

    void deleteProduct(UUID id);
}
