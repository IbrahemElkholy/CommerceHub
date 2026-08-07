package com.commercehub.cart.service;

import com.commercehub.catalog.repository.ProductRepository;
import com.commercehub.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class CatalogProductPriceLookup implements ProductPriceLookup {

    private final ProductRepository productRepository;

    public CatalogProductPriceLookup(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public BigDecimal getPrice(UUID productId) {
        return productRepository.findByIdAndDeletedAtIsNull(productId)
                .map(p -> p.getPrice())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
    }
}
