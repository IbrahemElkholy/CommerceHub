package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.BrandResponse;
import com.commercehub.catalog.dto.CreateBrandRequest;
import com.commercehub.catalog.dto.UpdateBrandRequest;
import com.commercehub.catalog.entity.Brand;
import com.commercehub.catalog.mapper.BrandMapper;
import com.commercehub.catalog.repository.BrandRepository;
import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    public BrandServiceImpl(BrandRepository brandRepository, BrandMapper brandMapper) {
        this.brandRepository = brandRepository;
        this.brandMapper = brandMapper;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("brands")
    public Page<BrandResponse> getAllBrands(Pageable pageable) {
        return brandRepository.findAll(pageable).map(brandMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getBrandById(Long id) {
        return brandMapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse createBrand(CreateBrandRequest request) {
        if (brandRepository.existsByName(request.name())) {
            throw new ConflictException("Brand name already exists: " + request.name(), "BRAND_NAME_EXISTS");
        }
        Brand brand = new Brand();
        brand.setName(request.name());
        brand.setSlug(request.slug());
        brand.setLogoUrl(request.logoUrl());
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    @Override
    @Transactional
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse updateBrand(Long id, UpdateBrandRequest request) {
        Brand brand = findOrThrow(id);
        if (request.name() != null) brand.setName(request.name());
        if (request.slug() != null) brand.setSlug(request.slug());
        if (request.logoUrl() != null) brand.setLogoUrl(request.logoUrl());
        return brandMapper.toResponse(brandRepository.save(brand));
    }

    private Brand findOrThrow(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found: " + id, "BRAND_NOT_FOUND"));
    }
}
