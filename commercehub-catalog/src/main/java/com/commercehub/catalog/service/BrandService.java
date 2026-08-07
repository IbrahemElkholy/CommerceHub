package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.BrandResponse;
import com.commercehub.catalog.dto.CreateBrandRequest;
import com.commercehub.catalog.dto.UpdateBrandRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BrandService {

    Page<BrandResponse> getAllBrands(Pageable pageable);

    BrandResponse getBrandById(Long id);

    BrandResponse createBrand(CreateBrandRequest request);

    BrandResponse updateBrand(Long id, UpdateBrandRequest request);
}
