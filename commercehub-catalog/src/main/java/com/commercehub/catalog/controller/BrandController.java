package com.commercehub.catalog.controller;

import com.commercehub.catalog.dto.BrandResponse;
import com.commercehub.catalog.dto.CreateBrandRequest;
import com.commercehub.catalog.dto.UpdateBrandRequest;
import com.commercehub.catalog.service.BrandService;
import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog/brands")
@Tag(name = "Brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping
    @Operation(summary = "List all brands")
    public ApiResponse<PagedResponse<BrandResponse>> list(@PageableDefault(size = 50) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(brandService.getAllBrands(pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create brand (admin)")
    public ApiResponse<BrandResponse> create(@Valid @RequestBody CreateBrandRequest request) {
        return ApiResponse.ok(brandService.createBrand(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update brand (admin)")
    public ApiResponse<BrandResponse> update(@PathVariable Long id, @RequestBody UpdateBrandRequest request) {
        return ApiResponse.ok(brandService.updateBrand(id, request));
    }
}
