package com.commercehub.catalog.repository;

import com.commercehub.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Product> findBySkuAndDeletedAtIsNull(String sku);

    boolean existsBySkuAndDeletedAtIsNull(String sku);
}
